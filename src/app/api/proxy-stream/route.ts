import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Apply stealth plugin to avoid detection (with error handling for webpack)
try {
  puppeteer.use(StealthPlugin());
} catch (error) {
  console.warn('Stealth plugin not available, proceeding without it');
}

// Enhanced ad filtering for HLS manifests - more aggressive filtering with filler replacement
function filterHLSManifest(manifestText: string): string {
  const adIndicators = [
    // Standard ad tags
    '#EXT-X-DATERANGE:CLASS="ad"',
    '#EXT-X-DATERANGE:ID="ad"',
    '#EXT-X-DATERANGE:CLASS="com.apple.ads"',
    '#EXT-X-SCTE35',
    '#EXT-X-CUE',
    '#EXT-X-CUE-IN',
    '#EXT-X-CUE-OUT',
    '#EXT-X-CUE-OUT-CONT',

    // Common ad keywords in URLs and metadata
    'ad',
    'ads',
    'advert',
    'advertisement',
    'preroll',
    'midroll',
    'postroll',
    'sponsor',
    'sponsored',
    'commercial',
    'promo',
    'promotion',
    'tracking',
    'analytics',
    'impression',
    'pixel',
    'beacon',
    'vast',
    'vpaid',
    'ima',
    'doubleclick',
    'googlesyndication',
    'amazon-adsystem',
    'pubmatic',
    'appnexus',
    'openx',
    'thetradedesk',
    'media.net',
    'criteo',
    'outbrain',
    'taboola',
    'yieldmo',
    'spotx',
    'freewheel',
    'brightcove',
    'jwplayer-ads',
    'videojs-ads',

    // Mobile-specific ad patterns
    'mobile-ad',
    'app-ad',
    'interstitial',
    'rewarded',
    'native-ad',
    'banner-ad',
    'popup-ad',
    'overlay-ad',

    // Common ad server domains in URLs
    'adsystem.',
    'adserver.',
    'doubleclick.net',
    'googlesyndication.com',
    'amazon-adsystem.com',
    'pubmatic.com',
    'appnexus.com',
    'openx.com',
    'thetradedesk.com',
    'media.net',
    'criteo.com',
    'outbrain.com',
    'taboola.com',
    'yieldmo.com',
    'spotx.tv',
    'freewheel.tv',
    'brightcove.com',
    'jwplayer.com/ads',
    'videojs.com/ads',

    // Additional patterns for vidsrc and similar sites
    'vast.',
    'ima.',
    'googletagmanager',
    'google-analytics',
    'facebook.com/tr',
    'twitter.com/i/ads',
    'linkedin.com/li_ads',
    'pinterest.com/ct',
    'tiktok.com/i/ads',
    'snapchat.com/ads',
    'instagram.com/ads',
    'youtube.com/api/stats',
    'vimeo.com/api/stats',
    'dailymotion.com/api/stats',

    // Vidsrc specific patterns
    'vidsrc.xyz/ads',
    'vidsrc.to/ads',
    'vidsrc.me/ads',
    'vidsrc.pro/ads',
    'embed.su/ads',
    'player.vidsrc.me/ads',
    'cdn.vidsrc.me/ads',
    'cdn.vidsrc.pro/ads',
  ];

  const lines = manifestText.split('\n');
  const filteredLines: string[] = [];
  let skipSegment = false;
  let segmentDuration = 0;
  let inAdBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check if this line contains ad indicators
    let isAdLine = false;
    for (const indicator of adIndicators) {
      if (lowerLine.includes(indicator)) {
        isAdLine = true;
        break;
      }
    }

    // Handle EXTINF duration lines (segment metadata)
    if (line.startsWith('#EXTINF:')) {
      const durationMatch = line.match(/#EXTINF:([0-9.]+)/);
      if (durationMatch) {
        segmentDuration = parseFloat(durationMatch[1]);
      }
    }

    // Skip ad-related lines and very short segments (likely ads)
    if (isAdLine || (segmentDuration > 0 && segmentDuration < 5 && lowerLine.includes('.ts'))) {
      skipSegment = true;
      inAdBlock = true;
      // Replace ad segments with filler
      if (line.includes('.ts')) {
        const fillerUrl = '/api/proxy-stream/filler.ts';
        filteredLines.push(fillerUrl);
      }
      continue;
    }

    // If we're in an ad block, skip until we find a non-ad segment
    if (inAdBlock && !line.startsWith('#') && line.trim()) {
      // Check if this looks like a real content segment
      if (line.includes('.ts') && segmentDuration > 10) {
        inAdBlock = false;
      } else {
        continue;
      }
    }

    // If we're not skipping and it's a segment URL, add it
    if (!skipSegment) {
      filteredLines.push(line);
    }

    // Reset skip flag after processing the segment
    if (!line.startsWith('#') && line.trim()) {
      skipSegment = false;
      segmentDuration = 0;
    }
  }

  return filteredLines.join('\n');
}

// Function to extract video sources using Puppeteer
async function extractVideoSources(url: string): Promise<string[]> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    // Set user agent and headers
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Extract video sources
    const videoSources = await page.evaluate(() => {
      const sources: string[] = [];
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        if (video.src) sources.push(video.src);
        const sourcesEl = video.querySelectorAll('source');
        sourcesEl.forEach(src => {
          if (src.src) sources.push(src.src);
        });
      });

      // Also check for HLS manifests in script tags or data attributes
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        const content = script.textContent || '';
        const hlsMatch = content.match(/"([^"]*\.m3u8[^"]*)"/g);
        if (hlsMatch) {
          hlsMatch.forEach(match => {
            const url = match.slice(1, -1);
            if (url.includes('.m3u8')) sources.push(url);
          });
        }
      });

      return sources;
    });

    return videoSources;
  } catch (error) {
    console.error('Puppeteer extraction error:', error);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

// Function to inject ad-blocking scripts into HTML
function injectAdBlockScripts(html: string): string {
  const adBlockScript = `
    <script>
      (function() {
        // Block common ad selectors
        const adSelectors = [
          '[id*="ad"]', '[class*="ad"]', '[id*="banner"]', '[class*="banner"]',
          '[id*="promo"]', '[class*="promo"]', '[id*="sponsor"]', '[class*="sponsor"]',
          'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]',
          'iframe[src*="amazon-adsystem"]', 'iframe[src*="pubmatic"]'
        ];

        function removeAds() {
          adSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.remove());
          });
        }

        // Run on load and periodically
        removeAds();
        setInterval(removeAds, 2000);

        // Block ad network requests
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          const url = args[0];
          if (typeof url === 'string' && (
            url.includes('doubleclick.net') ||
            url.includes('googlesyndication.com') ||
            url.includes('amazon-adsystem.com') ||
            url.includes('pubmatic.com') ||
            url.includes('appnexus.com')
          )) {
            return Promise.reject(new Error('Ad request blocked'));
          }
          return originalFetch.apply(this, args);
        };
      })();
    </script>
  `;

  // Inject before closing </head> or at the end of <body>
  if (html.includes('</head>')) {
    return html.replace('</head>', adBlockScript + '</head>');
  } else if (html.includes('</body>')) {
    return html.replace('</body>', adBlockScript + '</body>');
  } else {
    return html + adBlockScript;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Validate URL to prevent abuse
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Only allow streaming URLs from trusted sources
  const allowedDomains = [
    'vidsrc.xyz',
    'vidsrc.to',
    'vidsrc.me',
    'vidsrc.pro',
    'embed.su',
    'player.vidsrc.me',
    'player.vidsrc.pro',
    'cdn.vidsrc.me',
    'cdn.vidsrc.pro',
  ];

  const urlObj = new URL(url);
  const isAllowed = allowedDomains.some(domain =>
    urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
  );

  if (!isAllowed) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
  }

  try {
    // Check if URL is an HTML page that might contain video sources
    const isHtmlPage = url.includes('embed') || url.includes('player') || !url.includes('.m3u8') && !url.includes('.ts');

    let response;
    let contentType = '';
    let body: string | ArrayBuffer = '';

    if (isHtmlPage) {
      // Use Puppeteer to extract video sources from HTML pages
      const videoSources = await extractVideoSources(url);
      if (videoSources.length > 0) {
        // If we found HLS sources, redirect to the first one
        const hlsSource = videoSources.find(src => src.includes('.m3u8'));
        if (hlsSource) {
          const redirectUrl = `/api/proxy-stream?url=${encodeURIComponent(hlsSource)}`;
          return NextResponse.redirect(new URL(redirectUrl, request.url));
        }
        // Otherwise, fetch the first video source
        const videoUrl = videoSources[0];
        response = await fetch(videoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        contentType = response.headers.get('content-type') || '';
        body = await response.arrayBuffer();
      } else {
        // Fallback to regular fetch for HTML pages
        response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        contentType = response.headers.get('content-type') || '';
        const htmlText = await response.text();
        body = injectAdBlockScripts(htmlText);
      }
    } else {
      // Regular fetch for manifests and segments
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      contentType = response.headers.get('content-type') || '';
      body = await response.arrayBuffer();
    }

    // If it's a manifest, filter ads
    if (
      contentType.includes('application/vnd.apple.mpegurl') ||
      url.endsWith('.m3u8')
    ) {
      const manifestText = typeof body === 'string' ? body : new TextDecoder().decode(body);
      const filteredManifest = filterHLSManifest(manifestText);
      return new NextResponse(filteredManifest, {
        status: 200,
        headers: { 'Content-Type': 'application/vnd.apple.mpegurl' },
      });
    }

    // If it's HTML, return injected HTML
    if (contentType.includes('text/html') && typeof body === 'string') {
      return new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // Otherwise (TS segments, keys, etc.) → just proxy raw
    const arrayBuffer = typeof body === 'string' ? new TextEncoder().encode(body) : body;
    return new NextResponse(arrayBuffer, {
      status: response.status,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json({ error: 'Failed to fetch stream' }, { status: 500 });
  }
}
