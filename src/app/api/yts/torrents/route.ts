import { NextRequest, NextResponse } from 'next/server';
import { getMoviesByIMDBOrTitle } from '@/lib/yts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imdbId = searchParams.get('imdbId') || '';
    const title = searchParams.get('title') || '';
    const yearValue = searchParams.get('year');
    const year = yearValue ? Number(yearValue) : undefined;

    if (!imdbId && !title) {
      return NextResponse.json({ error: 'imdbId or title is required' }, { status: 400 });
    }

    const movies = await getMoviesByIMDBOrTitle(imdbId, title || undefined, year);

    if (!movies.length) {
      return NextResponse.json({ movies: [] }, { status: 404 });
    }

    return NextResponse.json({ movies });
  } catch (error) {
    console.error('YTS lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch torrent information' },
      { status: 502 }
    );
  }
}