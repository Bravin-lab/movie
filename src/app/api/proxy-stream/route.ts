import { NextRequest, NextResponse } from 'next/server';

// Enhanced ad filtering for HLS manifests - more aggressive filtering
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
  ];

  const lines = manifestText.split('\n');
  const filteredLines: string[] = [];
  let skipSegment = false;
  let segmentDuration = 0;

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
      continue;
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
    const response = await fetch(url, {
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

    const contentType = response.headers.get('content-type') || '';

    // If it's a manifest, filter ads
    if (
      contentType.includes('application/vnd.apple.mpegurl') ||
      url.endsWith('.m3u8')
    ) {
      const manifestText = await response.text();
      const filteredManifest = filterHLSManifest(manifestText);
      return new NextResponse(filteredManifest, {
        status: 200,
        headers: { 'Content-Type': 'application/vnd.apple.mpegurl' },
      });
    }

    // Otherwise (TS segments, keys, etc.) → just proxy raw
    const body = await response.arrayBuffer();
    return new NextResponse(body, {
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
