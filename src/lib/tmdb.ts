const TMDB_API_KEY: string = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
const TMDB_API_BASE: string = 'https://api.themoviedb.org/3';

async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(TMDB_API_BASE + '/' + endpoint);
  url.searchParams.append('api_key', TMDB_API_KEY);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('TMDB API error: ' + res.status + ' ' + res.statusText);
  }
  return res.json();
}

export async function searchMovies(query: string, page: number = 1): Promise<any> {
  return fetchFromTMDB('search/movie', { query, page: page.toString() });
}

export async function getTrendingMovies(timeWindow: string = 'week'): Promise<any> {
  return fetchFromTMDB('trending/movie/' + timeWindow);
}

export async function getPopularMovies(page: number = 1): Promise<any> {
  return fetchFromTMDB('movie/popular', { page: page.toString() });
}

export async function getUpcomingMovies(page: number = 1): Promise<any> {
  return fetchFromTMDB('movie/upcoming', { page: page.toString() });
}

export async function getMovieDetails(movieId: number): Promise<any> {
  return fetchFromTMDB('movie/' + movieId, { append_to_response: 'credits' });
}

export async function getMovieReviews(movieId: number): Promise<any> {
  return fetchFromTMDB(`movie/${movieId}/reviews`);
}

export async function searchTVShows(query: string, page: number = 1): Promise<any> {
  return fetchFromTMDB('search/tv', { query, page: page.toString() });
}

export async function getTrendingTVShows(timeWindow: string = 'week'): Promise<any> {
  return fetchFromTMDB('trending/tv/' + timeWindow);
}

export async function getPopularTVShows(page: number = 1): Promise<any> {
  return fetchFromTMDB('tv/popular', { page: page.toString() });
}

export async function getUpcomingTVShows(page: number = 1): Promise<any> {
  return fetchFromTMDB('tv/on_the_air', { page: page.toString() });
}

export async function getTVShowDetails(tvShowId: number): Promise<any> {
  return fetchFromTMDB('tv/' + tvShowId, { append_to_response: 'credits' });
}

export async function getTVShowSeasonDetails(tvShowId: number, seasonNumber: number): Promise<any> {
  return fetchFromTMDB(`tv/${tvShowId}/season/${seasonNumber}`);
}
