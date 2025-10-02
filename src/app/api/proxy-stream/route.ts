import { NextRequest, NextResponse } from 'next/server';

function filterHLSManifest(manifestText: string): string {
  const adIndicators = [
    '#EXT-X-DATERANGE:CLASS="ad"',
    '#EXT-X-DATERANGE:ID="ad"',
    '#EXT-X-DATERANGE:CLASS="com.apple.ads"',
    '#EXT-X-DATERANGE:ID="preroll"',
    '#EXT-X-DATERANGE:ID="midroll"',
    '#EXT-X-DATERANGE:ID="postroll"',
    '#EXT-X-CUE',
    '#EXT-X-SCTE35',
    'ad',
    'ads',
    'advert',
    'advertisement',
    'skip',
    'preroll',
    'postroll',
    'midroll',
    'commercial',
    'promo',
    'sponsor',
    'redirect',
    'click',
    'pause',
    'overlay',
    'banner',
    'popup',
    'interstitial',
    'tracking',
    'analytics',
    'impression',
    'adsegment',
    'adbreak',
    'ad-marker',
    'ad_tag',
    'ad_url',
    'touch',
    'interaction',
    'useraction',
    'user_interaction',
    'cue',
    'scte',
    'break',
    'slate',
  ];

  const lines = manifestText.split('\n');
  const filteredLines = lines.filter(line => {
    for (const indicator of adIndicators) {
      if (line.toLowerCase().includes(indicator.toLowerCase())) {
        return false;
      }
    }
    return true;
  });
  return filteredLines.join('\n');
}



function rewriteUrlsToAbsolute(html: string, baseUrl: string): string {
  const url = new URL(baseUrl);
  const base = `${url.protocol}//${url.host}`;

  // Add base tag and script to proxy HLS requests
  const script = `<script>
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  if (typeof url === 'string' && url.includes('.m3u8')) {
    url = '/api/proxy-stream?url=' + encodeURIComponent(url.startsWith('http') ? url : '${base}' + url);
  }
  return originalFetch.call(this, url, options);
};
const originalXMLHttpRequest = window.XMLHttpRequest;
window.XMLHttpRequest = function() {
  const xhr = new originalXMLHttpRequest();
  const originalOpen = xhr.open;
  xhr.open = function(method, url, ...args) {
    if (typeof url === 'string' && url.includes('.m3u8')) {
      url = '/api/proxy-stream?url=' + encodeURIComponent(url.startsWith('http') ? url : '${base}' + url);
    }
    return originalOpen.call(this, method, url, ...args);
  };
  return xhr;
};
</script>`;
  html = html.replace(/<head>/i, `<head><base href="${base}">${script}`);

  const attributes = ['src', 'href', 'data-src', 'poster'];

  let rewrittenHtml = html;

  attributes.forEach(attr => {
    const regex = new RegExp(`(${attr})="(/[^"]*)"`, 'gi');
    rewrittenHtml = rewrittenHtml.replace(regex, (match, attrName, path) => {
      return `${attrName}="${base}${path}"`;
    });

    const protocolRegex = new RegExp(`(${attr})="(//[^"]*)"`, 'gi');
    rewrittenHtml = rewrittenHtml.replace(protocolRegex, (match, attrName, path) => {
      const fullUrl = `${url.protocol}${path}`;
      return `${attrName}="${fullUrl}"`;
    });
  });

  return rewrittenHtml;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  console.log("Proxy request for URL:", url);
  if (!url) {
    console.error("Missing url parameter in proxy request");
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Create AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    clearTimeout(timeoutId);

    console.log(`Fetched URL: ${url} with status: ${response.status}`);
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    console.log(`Content-Type: ${contentType}`);

    if (response.status >= 400) {
      console.warn(`Upstream response error ${response.status} for URL: ${url}`);
      return new NextResponse('', {
        status: 200,
        headers: {
          'Content-Type': contentType,
        },
      });
    }

    if (
      contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('vnd.apple.mpegurl') ||
      url.endsWith('.m3u8')
    ) {
      const manifestText = await response.text();
      console.log(`Original manifest length: ${manifestText.length}`);
      const filteredManifest = filterHLSManifest(manifestText);
      console.log(`Filtered manifest length: ${filteredManifest.length}`);
      return new NextResponse(filteredManifest, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
        },
      });
    } else if (contentType.includes('text/html')) {
      const htmlText = await response.text();
      console.log(`Original HTML length: ${htmlText.length}`);
      // For streaming embeds, rewrite relative URLs to absolute to allow direct loading from vidsrc.xyz
      const rewrittenHtml = rewriteUrlsToAbsolute(htmlText, url);
      console.log(`Rewritten HTML length: ${rewrittenHtml.length}`);
      return new NextResponse(rewrittenHtml, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Content-Security-Policy': "frame-src 'self' https://vidsrc.xyz https://*.vidsrc.xyz; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vidsrc.xyz https://*.vidsrc.xyz; style-src 'self' 'unsafe-inline' https://vidsrc.xyz https://*.vidsrc.xyz; img-src 'self' data: https:; connect-src 'self' https://vidsrc.xyz https://*.vidsrc.xyz;",
        },
      });
    } else {
      const body = await response.arrayBuffer();
      console.log(`Forwarding content of length: ${body.byteLength}`);
      return new NextResponse(body, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
        },
      });
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Failed to fetch content in proxy:", error);

    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("Request timed out for URL:", url);
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
    }

    // For other errors, return 500
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}
