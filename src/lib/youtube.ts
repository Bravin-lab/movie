const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';

export async function searchYouTubeTrailer(query: string) {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key is not set in environment variables. Skipping YouTube trailer search.');
    return null;
  }

  const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

  const url = new URL(YOUTUBE_API_BASE + '/search');
  url.searchParams.append('key', YOUTUBE_API_KEY);
  url.searchParams.append('part', 'snippet');
  url.searchParams.append('q', query);
  url.searchParams.append('type', 'video');
  url.searchParams.append('maxResults', '1');
  url.searchParams.append('videoEmbeddable', 'true');

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('YouTube API error: ' + res.status + ' ' + res.statusText);
  }
  const data = await res.json();
  if (data.items && data.items.length > 0) {
    return data.items[0].id.videoId;
  }
  return null;
}
