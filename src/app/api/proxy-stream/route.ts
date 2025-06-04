import { NextRequest, NextResponse } from 'next/server';

function filterHLSManifest(manifestText: string): string {
  // Enhanced filtering: remove lines containing common ad markers or ad segments
  // Customize this list based on actual ad tags used by vidsrc or observed in manifests
  const adIndicators = [
    '#EXT-X-DATERANGE:CLASS="ad"',
    '#EXT-X-DATERANGE:ID="ad"',
    'ad',
    'ads',
    'advertisement',
    'skip',
    'preroll',
    'postroll',
    'midroll',
    'commercial',
    'promo',
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

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    if (
      contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('vnd.apple.mpegurl') ||
      url.endsWith('.m3u8')
    ) {
      // HLS manifest detected, parse and filter ads
      const manifestText = await response.text();
      const filteredManifest = filterHLSManifest(manifestText);
      return new NextResponse(filteredManifest, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
        },
      });
    } else {
      // For other content types, just forward the response as is
      const body = await response.arrayBuffer();
      return new NextResponse(body, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
        },
      });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}
