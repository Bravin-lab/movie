import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const cloudnestraAssets = new Set([
    '/rings.svg',
    '/f59d610a61063c7ef3ccdc1fd40d2ae6.js',
    '/style_rcp-e600e6.css',
    '/base64.js',
    '/sbx.js',
    '/jquery-3.7.1.min.js',
    '/sources.js',
    '/reporting.js',
    '/asdf.js',
  ]);

  // Proxy the player shell assets through the stream proxy so the embed can load without 404s.
  if (cloudnestraAssets.has(pathname)) {
    const baseUrl = 'https://cloudnestra.com';
    const fullPath = pathname + search;
    const proxyUrl = `/api/stream-proxy?url=${encodeURIComponent(baseUrl + fullPath)}&strict=true`;
    return NextResponse.rewrite(new URL(proxyUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/rings.svg',
    '/f59d610a61063c7ef3ccdc1fd40d2ae6.js',
    '/style_rcp-e600e6.css',
    '/base64.js',
    '/sbx.js',
    '/jquery-3.7.1.min.js',
    '/sources.js',
    '/reporting.js',
    '/asdf.js',
  ],
};
