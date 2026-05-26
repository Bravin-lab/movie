import { NextRequest, NextResponse } from 'next/server';

const VID_SRC_MIRRORS = ['vidsrc.xyz', 'vidsrc.to', 'vidsrc.net', 'vidsrc.me'];

const EXACT_PROXY_PATHS: Record<string, string> = {
  '/style_rcp-e600e6.css': 'https://cloudnestra.com/style_rcp-e600e6.css',
  '/base64.js': 'https://cloudnestra.com/base64.js',
  '/sbx.js': 'https://cloudnestra.com/sbx.js',
  '/jquery-3.7.1.min.js': 'https://cloudnestra.com/jquery-3.7.1.min.js',
  '/sources.js': 'https://cloudnestra.com/sources.js',
  '/reporting.js': 'https://cloudnestra.com/reporting.js',
  '/asdf.js': 'https://cloudnestra.com/asdf.js',
};

function mapIncomingPath(pathname: string): string | null {
  if (EXACT_PROXY_PATHS[pathname]) {
    return EXACT_PROXY_PATHS[pathname];
  }

  if (pathname.startsWith('/api/assets/')) {
    // Vidsrc often references /api/assets/... paths that should resolve on the provider as /assets/...
    return pathname.replace('/api/assets/', '/assets/');
  }

  if (pathname.startsWith('/cdn-cgi/')) {
    return pathname;
  }

  if (pathname === '/rings.svg' || pathname.startsWith('/f59d610a61063c7ef3ccdc1fd40d2ae6.js')) {
    return pathname;
  }

  return null;
}

async function proxyWithFallback(providerPath: string, search: string): Promise<NextResponse> {
  const candidateUrls = providerPath.startsWith('http://') || providerPath.startsWith('https://')
    ? [providerPath + search]
    : VID_SRC_MIRRORS.map((mirrorHost) => `https://${mirrorHost}${providerPath}${search}`);

  for (const url of candidateUrls) {
    const refererHost = new URL(url).hostname;

    try {
      const response = await fetch(url, {
        signal:
          typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
            ? AbortSignal.timeout(4000)
            : undefined,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: `https://${refererHost}/`,
        },
      });

      // Some mirrors can return 403/404 for non-critical assets; keep trying other mirrors.
      if (!response.ok) {
        continue;
      }

      const body = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      return new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch {
      // Try the next mirror.
      continue;
    }
  }

  // Do not break playback when optional third-party assets are unreachable.
  return new NextResponse('', {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const mappedPath = mapIncomingPath(pathname);

  if (mappedPath) {
    return proxyWithFallback(mappedPath, request.nextUrl.search || '');
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
