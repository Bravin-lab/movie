import { NextRequest, NextResponse } from 'next/server';
import { getMoviesByIMDB } from '@/lib/yts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imdbId = searchParams.get('imdb_id');
    const quality = searchParams.get('quality') || '1080p';

    if (!imdbId) {
      return NextResponse.json({ error: 'IMDB ID is required' }, { status: 400 });
    }

    // Get movie data from YTS
    const movies = await getMoviesByIMDB(imdbId);

    if (!movies || movies.length === 0) {
      return NextResponse.json({ error: 'Movie not found on YTS' }, { status: 404 });
    }

    const movie = movies[0];

    // Find torrent with preferred quality
    let selectedTorrent = movie.torrents.find(t => t.quality === quality);

    // Fallback to any available quality if preferred not found
    if (!selectedTorrent) {
      selectedTorrent = movie.torrents[0];
    }

    if (!selectedTorrent) {
      return NextResponse.json({ error: 'No torrents available' }, { status: 404 });
    }

    // Return torrent information for client-side streaming
    return NextResponse.json({
      movie: {
        id: movie.id,
        title: movie.title,
        year: movie.year,
        rating: movie.rating,
        runtime: movie.runtime,
        genres: movie.genres,
        summary: movie.summary,
        large_cover_image: movie.large_cover_image,
      },
      torrent: {
        hash: selectedTorrent.hash,
        quality: selectedTorrent.quality,
        size: selectedTorrent.size,
        seeds: selectedTorrent.seeds,
        peers: selectedTorrent.peers,
        url: selectedTorrent.url,
      },
      available_qualities: movie.torrents.map(t => ({
        quality: t.quality,
        size: t.size,
        seeds: t.seeds,
        peers: t.peers,
      })),
    });

  } catch (error) {
    console.error('Torrent stream API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch torrent information' },
      { status: 500 }
    );
  }
}
