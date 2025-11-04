import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  try {
    // Fetch the original content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://vidsrc.xyz/',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';
    let body = await response.text();

    // If it's HTML, filter out ads
    if (contentType.includes('text/html')) {
      body = filterAdsFromHtml(body);
    }

    // Return the filtered content with appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');
    headers.set('X-Frame-Options', 'ALLOWALL');

    return new NextResponse(body, {
      status: response.status,
      headers,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
  }
}

function filterAdsFromHtml(html: string): string {
  // Remove common ad-related scripts and elements
  const adPatterns = [
    // Remove ad scripts
    /<script[^>]*>(?:[^<]*(?:googletag|adsbygoogle|doubleclick|amazon-adsystem|facebook|twitter|instagram|youtube|analytics)[^<]*)*<\/script>/gi,
    // Remove ad iframes
    /<iframe[^>]*(?:ads|advertisement|banner)[^>]*>[\s\S]*?<\/iframe>/gi,
    // Remove ad divs
    /<div[^>]*(?:ad-|advertisement|banner|popup)[^>]*>[\s\S]*?<\/div>/gi,
    // Remove Google AdSense and similar
    /<ins[^>]*class="[^"]*adsbygoogle[^"]*"[^>]*>[\s\S]*?<\/ins>/gi,
    // Remove tracking pixels
    /<img[^>]*(?:tracking|pixel|beacon)[^>]*>/gi,
    // Remove ad-related CSS
    /<style[^>]*>(?:[^<]*(?:ad-|advertisement|banner)[^<]*)*<\/style>/gi,
  ];

  let filteredHtml = html;

  // Apply all ad filtering patterns
  for (const pattern of adPatterns) {
    filteredHtml = filteredHtml.replace(pattern, '');
  }

  // Additional cleanup: remove empty script/style tags
  filteredHtml = filteredHtml.replace(/<script[^>]*><\/script>/gi, '');
  filteredHtml = filteredHtml.replace(/<style[^>]*><\/style>/gi, '');

  // Remove common ad network domains from script sources
  filteredHtml = filteredHtml.replace(/src="[^"]*(?:googletag|adsystem|doubleclick|amazon-adsystem|facebook|twitter|instagram)[^"]*"/gi, 'src=""');

  return filteredHtml;
}
