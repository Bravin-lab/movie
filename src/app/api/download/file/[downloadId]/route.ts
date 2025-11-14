export const runtime = 'nodejs';

const TORRENT_SERVICE_URL =
  process.env.TORRENT_SERVICE_URL || 'http://localhost:3001';

export async function GET(req: Request, context: unknown) {
  const { params } = (context as { params?: { downloadId?: string } }) || {};
  const downloadId = params?.downloadId;

  if (!downloadId) {
    return new Response(JSON.stringify({ error: 'Missing downloadId' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const name = url.searchParams.get('name') ?? undefined;
    const range = req.headers.get('range') ?? undefined;

    const upstream = await fetch(
      `${TORRENT_SERVICE_URL}/api/download/file/${downloadId}`,
      { headers: range ? { Range: range } : undefined }
    );

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return new Response(
        JSON.stringify({ error: text || 'File not found or not ready' }),
        {
          status: upstream.status || 404,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    const body = upstream.body;
    if (!body) {
      return new Response(JSON.stringify({ error: 'No file stream' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    const contentType =
      upstream.headers.get('content-type') || 'application/octet-stream';
    const upstreamDisposition = upstream.headers.get('content-disposition');
    const contentDisposition =
      upstreamDisposition ||
      `attachment; filename="${name || `movie-${downloadId}.mp4`}"`;
    const contentLength = upstream.headers.get('content-length') || undefined;
    const acceptRanges =
      upstream.headers.get('accept-ranges') || (range ? 'bytes' : undefined);

    return new Response(body, {
      status: upstream.status, // 200 or 206
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        ...(contentLength ? { 'Content-Length': contentLength } : {}),
        ...(acceptRanges ? { 'Accept-Ranges': acceptRanges } : {}),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Proxy download error:', err);
    return new Response(JSON.stringify({ error: 'Failed to download file' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}