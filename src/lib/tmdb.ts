const TMDB_API_KEY: string = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
const TMDB_API_BASE: string = 'https://api.themoviedb.org/3';

async function fetchFromTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(TMDB_API_BASE + '/' + endpoint);
  url.searchParams.append('api_key', TMDB_API_KEY);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('TMDB API error: ' + res.status + ' ' + res.statusText);
  }
  return res.json() as Promise<T>;
}

export interface Movie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface MovieListResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  vote_average: number;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface TVShowListResponse {
  page: number;
  results: TVShow[];
  total_pages: number;
  total_results: number;
}

export async function searchMovies(query: string, page: number = 1): Promise<MovieListResponse> {
  return fetchFromTMDB<MovieListResponse>('search/movie', { query, page: page.toString() });
}

export async function getTrendingMovies(timeWindow: string = 'week'): Promise<MovieListResponse> {
  return fetchFromTMDB<MovieListResponse>('trending/movie/' + timeWindow);
}

export async function getPopularMovies(page: number = 1): Promise<MovieListResponse> {
  return fetchFromTMDB<MovieListResponse>('movie/popular', { page: page.toString() });
}

export async function getUpcomingMovies(page: number = 1): Promise<MovieListResponse> {
  return fetchFromTMDB<MovieListResponse>('movie/upcoming', { page: page.toString() });
}

export async function getMovieDetails(movieId: number): Promise<Movie & { credits: any }> {
  return fetchFromTMDB<Movie & { credits: any }>('movie/' + movieId, { append_to_response: 'credits' });
}

export async function getMovieReviews(movieId: number): Promise<any> {
  return fetchFromTMDB<any>(`movie/${movieId}/reviews`);
}

export async function searchTVShows(query: string, page: number = 1): Promise<TVShowListResponse> {
  return fetchFromTMDB<TVShowListResponse>('search/tv', { query, page: page.toString() });
}

export async function getTrendingTVShows(timeWindow: string = 'week'): Promise<TVShowListResponse> {
  return fetchFromTMDB<TVShowListResponse>('trending/tv/' + timeWindow);
}

export async function getPopularTVShows(page: number = 1): Promise<TVShowListResponse> {
  return fetchFromTMDB<TVShowListResponse>('tv/popular', { page: page.toString() });
}

export async function getUpcomingTVShows(page: number = 1): Promise<TVShowListResponse> {
  return fetchFromTMDB<TVShowListResponse>('tv/on_the_air', { page: page.toString() });
}

export async function getTVShowDetails(tvShowId: number): Promise<TVShow & { credits: any }> {
  return fetchFromTMDB<TVShow & { credits: any }>('tv/' + tvShowId, { append_to_response: 'credits' });
}

export async function getTVShowSeasonDetails(tvShowId: number, seasonNumber: number): Promise<any> {
  return fetchFromTMDB<any>(`tv/${tvShowId}/season/${seasonNumber}`);
}
