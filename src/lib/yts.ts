const YTS_API_BASES = [
  process.env.YTS_API_BASE,
  'https://movies-api.accel.li/api/v2',
  'https://yts.ag/api/v2',
  'https://yts.rs/api/v2',
  'https://yts.lt/api/v2',
  'https://yts.am/api/v2',
  'https://yts.mx/api/v2',
].filter((base): base is string => Boolean(base));

function buildYtsUrl(base: string, path: string): URL {
  return new URL(`${base}${path}`);
}

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

async function fetchMoviesByQuery(query: string): Promise<YTSMovie[]> {
  let lastError: unknown = null;

  for (const base of YTS_API_BASES) {
    const url = buildYtsUrl(base, '/list_movies.json');
    url.searchParams.append('query_term', query);
    url.searchParams.append('limit', '20');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url.toString(), { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`YTS API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.movies || [];
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to fetch YTS movies');
}

export async function searchMovies(query: string, page: number = 1, limit: number = 20): Promise<YTSSearchResponse> {
  const url = buildYtsUrl(YTS_API_BASES[0], '/list_movies.json');
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
  const url = buildYtsUrl(YTS_API_BASES[0], '/movie_details.json');
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
  return fetchMoviesByQuery(imdbId);
}

export async function getMoviesByIMDBOrTitle(
  imdbId: string,
  title?: string,
  year?: number
): Promise<YTSMovie[]> {
  const attempts: Array<Promise<YTSMovie[]>> = [];

  if (imdbId) {
    attempts.push(fetchMoviesByQuery(imdbId));
  }

  if (title) {
    attempts.push(fetchMoviesByQuery(title));
  }

  let lastError: unknown = null;

  for (const attempt of attempts) {
    try {
      const movies = await attempt;
      if (movies.length === 0) {
        continue;
      }

      if (imdbId) {
        const exactImdbMatches = movies.filter((movie) => movie.imdb_code === imdbId);
        if (exactImdbMatches.length > 0) {
          return exactImdbMatches;
        }
      }

      if (typeof year === 'number' && !Number.isNaN(year)) {
        const yearMatches = movies.filter((movie) => movie.year === year);
        if (yearMatches.length > 0) {
          return yearMatches;
        }
      }

      return movies;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError instanceof Error ? lastError : new Error('Failed to fetch YTS movies');
  }

  return [];
}

export async function getPopularMovies(page: number = 1, limit: number = 20): Promise<YTSSearchResponse> {
  const url = buildYtsUrl(YTS_API_BASES[0], '/list_movies.json');
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
  const url = buildYtsUrl(YTS_API_BASES[0], '/list_movies.json');
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
  const url = buildYtsUrl(YTS_API_BASES[0], '/list_movies.json');
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
  const url = buildYtsUrl(YTS_API_BASES[0], '/list_movies.json');
  url.searchParams.append('quality', quality);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`YTS API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
