import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Proxy requests for specific assets that are not being proxied
  if (pathname === '/rings.svg' || pathname.startsWith('/f59d610a61063c7ef3ccdc1fd40d2ae6.js')) {
    const baseUrl = 'https://vidsrc.xyz';
    const fullPath = pathname + search;
    const proxyUrl = `/api/proxy-stream?url=${encodeURIComponent(baseUrl + fullPath)}`;
    return NextResponse.rewrite(new URL(proxyUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/rings.svg',
    '^/f59d610a61063c7ef3ccdc1fd40d2ae6.js',
  ],
};
