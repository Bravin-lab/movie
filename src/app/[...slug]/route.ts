import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === '/rings.svg' || pathname.startsWith('/f59d610a61063c7ef3ccdc1fd40d2ae6.js')) {
    const url = pathname === '/rings.svg' ? 'https://vidsrc.xyz/rings.svg' : 'https://vidsrc.xyz/f59d610a61063c7ef3ccdc1fd40d2ae6.js';
    try {
      const response = await fetch(url);
      if (response.status >= 400) {
        return new NextResponse('', {
          status: 200,
          headers: {
            'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
          },
        });
      }
      const body = await response.arrayBuffer();
      return new NextResponse(body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        },
      });
    } catch {
      return new NextResponse('', {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });
    }
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
