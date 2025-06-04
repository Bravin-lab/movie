import { NextRequest, NextResponse } from 'next/server';

function filterHLSManifest(manifestText: string): string {
  // Basic example: remove lines containing ad markers or ad segments
  // This should be customized based on actual ad tags used by vidsrc
  const lines = manifestText.split('\n');
  const filteredLines = lines.filter(line => {
    // Remove lines that contain ad markers or known ad segment patterns
    if (
      (line.includes('#EXT-X-DATERANGE:') && line.includes('CLASS="ad"')) ||
      line.includes('ad') || // generic filter, may need refinement
      line.includes('ads') ||
      line.includes('advertisement')
    ) {
      return false;
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}
