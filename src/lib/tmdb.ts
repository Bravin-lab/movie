const TMDB_API_KEY: string = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
const TMDB_API_BASE: string = 'https://api.themoviedb.org/3';

async function fetchFromTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!TMDB_API_KEY) {
    console.error('TMDB API key is missing. Please set NEXT_PUBLIC_TMDB_API_KEY environment variable.');
    throw new Error('TMDB API key is missing');
  }
  const url = new URL(TMDB_API_BASE + '/' + endpoint);
  url.searchParams.append('api_key', TMDB_API_KEY);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error('TMDB API error:', res.status, res.statusText);
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

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Credits {
  cast: CastMember[];
  crew?: CrewMember[]; // typed crew members
}

export interface Episode {
  id: number;
  name: string;
  episode_number: number;
  overview: string;
  air_date: string;
  still_path: string | null;
}

export interface SeasonDetails {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: string;
  episodes: Episode[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface GenreListResponse {
  genres: Genre[];
}

export async function fetchGenres(): Promise<GenreListResponse> {
  return fetchFromTMDB<GenreListResponse>('genre/movie/list');
}

export async function discoverMoviesByGenre(genreId: number, page: number = 1): Promise<MovieListResponse> {
  return fetchFromTMDB<MovieListResponse>('discover/movie', { with_genres: genreId.toString(), page: page.toString() });
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

export async function getMovieDetails(movieId: number): Promise<Movie & { credits: Credits; genres: Genre[]; videos: { results: { id: string; key: string; name: string; site: string; type: string }[] } } & { external_ids: { imdb_id: string | null } }> {
  return fetchFromTMDB<Movie & { credits: Credits; genres: Genre[]; videos: { results: { id: string; key: string; name: string; site: string; type: string }[] } } & { external_ids: { imdb_id: string | null } }>('movie/' + movieId, { append_to_response: 'credits,videos,external_ids' });
}

export interface MovieReview {
  id: string;
  author: string;
  content: string;
  url: string;
}

export interface MovieReviewsResponse {
  id: number;
  page: number;
  results: MovieReview[];
  total_pages: number;
  total_results: number;
}

export async function getMovieReviews(movieId: number): Promise<MovieReviewsResponse> {
  return fetchFromTMDB<MovieReviewsResponse>(`movie/${movieId}/reviews`);
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

export async function getTVShowDetails(tvShowId: number): Promise<TVShow & { credits: Credits }> {
  return fetchFromTMDB<TVShow & { credits: Credits }>('tv/' + tvShowId, { append_to_response: 'credits' });
}

export async function getTVShowSeasonDetails(tvShowId: number, seasonNumber: number): Promise<SeasonDetails> {
  return fetchFromTMDB<SeasonDetails>(`tv/${tvShowId}/season/${seasonNumber}`);
}
