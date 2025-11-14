import { NextResponse } from 'next/server';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // Await the params
  console.log('Fetching external IDs for TV show ID:', id); // Log the ID being used

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY; // Use the correct variable
  if (!apiKey) {
    return NextResponse.json({ error: 'TMDB_API_KEY not set' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/external_ids?api_key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('TMDB API error:', text); // Log the error response
      return NextResponse.json({ error: text || 'TMDB error' }, { status: res.status });
    }

    const data = await res.json();
    console.log('External IDs data:', data); // Log the fetched data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching external IDs:', error); // Log the error
    return NextResponse.json({ error: 'Failed to fetch external IDs' }, { status: 500 });
  }
}