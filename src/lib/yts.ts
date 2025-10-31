const YTS_API_BASE = 'https://yts.mx/api/v2';

export interface YTSMovie {
  id: number;
  url: string;
  imdb_code: string;
  title: string;
  title_english: string;
  title_long: string;
  slug: string;
  year: number;
  rating: number;
  runtime: number;
  genres: string[];
  summary: string;
  description_full: string;
  synopsis: string;
  yt_trailer_code: string;
  language: string;
  mpa_rating: string;
  background_image: string;
  background_image_original: string;
  small_cover_image: string;
  medium_cover_image: string;
  large_cover_image: string;
  state: string;
  torrents: YTSTorrent[];
  date_uploaded: string;
  date_uploaded_unix: number;
}

export interface YTSTorrent {
  url: string;
  hash: string;
  quality: string;
  type: string;
  seeds: number;
  peers: number;
  size: string;
  size_bytes: number;
  date_uploaded: string;
  date_uploaded_unix: number;
}

export interface YTSResponse {
  status: string;
  status_message: string;
  data: {
    movie_count: number;
    limit: number;
    page_number: number;
    movies: YTSMovie[];
  };
}

export interface YTSSearchResponse extends YTSResponse {
  data: YTSResponse['data'] & {
    movie_count: number;
    movies: YTSMovie[];
  };
}

export async function searchMovies(query: string, page: number = 1, limit: number = 20): Promise<YTSSearchResponse> {
  const url = new URL(`${YTS_API_BASE}/list_movies.json`);
  url.searchParams.append('query_term', query);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`YTS API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getMovieDetails(movieId: number): Promise<YTSMovie> {
  const url = new URL(`${YTS_API_BASE}/movie_details.json`);
  url.searchParams.append('movie_id', movieId.toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`YTS API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.status !== 'ok' || !data.data.movie) {
    throw new Error('Movie not found');
  }

  return data.data.movie;
}

export async function getMoviesByIMDB(imdbId: string): Promise<YTSMovie[]> {
  const url = new URL(`${YTS_API_BASE}/list_movies.json`);
  url.searchParams.append('query_term', imdbId);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`YTS API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data?.movies || [];
}

export async function getPopularMovies(page: number = 1, limit: number = 20): Promise<YTSSearchResponse> {
  const url = new URL(`${YTS_API_BASE}/list_movies.json`);
  url.searchParams.append('sort_by', 'download_count');
  url.searchParams.append('order_by', 'desc');
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`YTS API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getLatestMovies(page: number = 1, limit: number = 20): Promise<YTSSearchResponse> {
  const url = new URL(`${YTS_API_BASE}/list_movies.json`);
  url.searchParams.append('sort_by', 'date_added');
  url.searchParams.append('order_by', 'desc');
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`YTS API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getMoviesByGenre(genre: string, page: number = 1, limit: number = 20): Promise<YTSSearchResponse> {
  const url = new URL(`${YTS_API_BASE}/list_movies.json`);
  url.searchParams.append('genre', genre);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`YTS API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getMoviesByQuality(quality: string, page: number = 1, limit: number = 20): Promise<YTSSearchResponse> {
  const url = new URL(`${YTS_API_BASE}/list_movies.json`);
  url.searchParams.append('quality', quality);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`YTS API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
