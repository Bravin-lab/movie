import { NextRequest, NextResponse } from 'next/server';

const TORRENT_SERVICE_URL = process.env.TORRENT_SERVICE_URL || 'http://localhost:3001';

export async function GET(_request: NextRequest) {
  try {
    const upstream = await fetch(`${TORRENT_SERVICE_URL}/api/downloads`);
    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return NextResponse.json({ error: text || 'Failed to fetch downloads' }, { status: upstream.status });
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('VPS downloads proxy error:', err);
    return NextResponse.json({ error: 'Proxy error fetching downloads' }, { status: 500 });
  }
}
