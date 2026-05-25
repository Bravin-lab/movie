import { NextRequest, NextResponse } from 'next/server';

const TORRENT_SERVICE_URL = process.env.TORRENT_SERVICE_URL || 'http://localhost:3001';
const MAX_ALLOWED_QUALITY = 720;

export async function POST(request: NextRequest) {
  try {
    const { magnetUrl, magnetUri, title, quality } = await request.json();
    const torrentUri = magnetUri || magnetUrl;

    const qualityValue = Number.parseInt(quality ?? '', 10);
    if (Number.isFinite(qualityValue) && qualityValue > MAX_ALLOWED_QUALITY) {
      return NextResponse.json(
        { error: 'Only 720p and below are allowed by the developer due to server load.' },
        { status: 400 }
      );
    }

    if (!torrentUri) {
      return NextResponse.json({ error: 'Magnet URL is required' }, { status: 400 });
    }

    console.log(`[INFO] Connecting to: ${TORRENT_SERVICE_URL}/api/download/start`);
    console.log(`[INFO] Magnet URL: ${torrentUri.substring(0, 50)}...`);

    // Increase timeout to 90 seconds for slow torrents
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('[ERROR] Request timed out after 90 seconds');
      controller.abort();
    }, 90000);

    const startTime = Date.now();

    try {
      const response = await fetch(`${TORRENT_SERVICE_URL}/api/download/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          magnetUri: torrentUri,
          fileName: `${title} [${quality}].mp4`
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`[INFO] VPS responded in ${elapsed}s with status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ERROR] VPS error (${response.status}):`, errorText);
        return NextResponse.json({ 
          error: `VPS error: ${errorText}` 
        }, { status: response.status });
      }

      const result = await response.json();
      console.log(`[SUCCESS] Download started:`, result);

      return NextResponse.json({
        downloadId: result.downloadId,
        message: 'Download started successfully',
        torrentName: result.torrentName
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }

  } catch (error) {
    console.error('[ERROR] Download API error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { 
            error: 'Connection timeout - The download request took too long. This might be due to slow peers or VPS being busy.',
            suggestion: 'Try again with a different torrent or check VPS logs'
          },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { 
          error: `Connection failed: ${error.message}`,
          url: TORRENT_SERVICE_URL
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET - Check download status (using query parameter)
export async function GET(request: NextRequest) {
  const downloadId = request.nextUrl.searchParams.get('downloadId');

  if (!downloadId) {
    return NextResponse.json({ error: 'Missing downloadId parameter' }, { status: 400 });
  }

  try {
    const vpsUrl = process.env.TORRENT_SERVICE_URL || 'http://localhost:3001';
    console.log(`[INFO] Checking status: ${downloadId}`);
    
    const response = await fetch(`${vpsUrl}/api/download/status/${downloadId}`, {
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[INFO] Download not found: ${downloadId}`);
        return NextResponse.json({ error: 'Download not found' }, { status: 404 });
      }
      throw new Error(`VPS returned status ${response.status}`);
    }

    const data = await response.json();
    console.log(`[INFO] Status for ${downloadId}: ${data.status} - ${data.progress}%`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('[ERROR] Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check download status' },
      { status: 500 }
    );
  }
}
