"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  getTrendingMovies,
  getPopularMovies,
  getUpcomingMovies,
  searchMovies,
} from "@/lib/tmdb";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average?: number;
}

export default function HomePage() {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isSearching) {
      async function fetchMovies() {
        try {
          const trendingData = await getTrendingMovies();
          const popularData = await getPopularMovies();
          const upcomingData = await getUpcomingMovies();

          setTrending(trendingData.results);
          setPopular(popularData.results);
          setUpcoming(upcomingData.results);
        } catch (error) {
          console.error("Failed to fetch movies", error);
        } finally {
          setLoading(false);
        }
      }
      fetchMovies();
    }
  }, [isSearching]);

  if (loading) {
    return <div className="p-8 text-center text-gray-400 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen">Loading movies...</div>;
  }

  const posterBaseUrl = "https://image.tmdb.org/t/p/w300";

  function handleMovieClick(id: number) {
    router.push(`/movie/${id}`);
  }

  async function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim() === "") {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    setLoading(true);
    setIsSearching(true);
    try {
      const data = await searchMovies(searchQuery.trim());
      setSearchResults(data.results);
    } catch (error) {
      console.error("Search failed", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleClearSearch() {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
  }

  const moviesToDisplay = isSearching ? searchResults : [];

  return (
    <main className="p-8 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen">
      <header
        className="mb-12 text-center bg-cover bg-center bg-no-repeat p-6 sm:p-12 rounded-lg"
        style={{ backgroundImage: trending.length > 0 ? `url(https://image.tmdb.org/t/p/original${trending[Math.floor(Math.random() * trending.length)].poster_path})` : undefined }}
      >
        <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 text-white drop-shadow-lg rainbow-text">Welcome.</h1>
        <p className="text-base sm:text-xl max-w-xl mx-auto mb-6 drop-shadow-lg rainbow-text">
          Millions of movies, TV shows and people to discover. Explore now.
        </p>
        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <input
            type="text"
            placeholder="Search movies, TV shows, people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:flex-grow px-4 py-2 rounded-md sm:rounded-l-md border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 rounded-md sm:rounded-r-md hover:bg-indigo-700 transition"
          >
            Search
          </button>
          {isSearching && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="w-full sm:w-auto px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition"
            >
              Clear
            </button>
          )}
        </form>
      </header>

      {isSearching ? (
        <section>
          <h2 className="text-4xl font-extrabold mb-8 border-b-4 border-indigo-600 inline-block pb-2">
            Search Results
          </h2>
          {moviesToDisplay.length === 0 ? (
            <p className="text-center text-gray-400">No results found.</p>
          ) : (
            <div className="flex overflow-x-auto space-x-8 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800">
              {moviesToDisplay.map((movie) => (
                <div
                  key={movie.id}
                  className="min-w-[180px] cursor-pointer transform transition-transform hover:scale-110 hover:shadow-2xl rounded-lg overflow-hidden bg-gray-800"
                  title={movie.title}
                  onClick={() => handleMovieClick(movie.id)}
                >
                  {movie.poster_path ? (
                    <Image
                      src={posterBaseUrl + movie.poster_path}
                      alt={movie.title}
                      width={180}
                      height={270}
                      className="rounded-t-lg shadow-lg"
                      priority
                    />
                  ) : (
                    <div className="bg-gray-700 h-48 rounded-t-lg flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  <div className="p-3 relative">
                    <div className="absolute top-2 right-2 w-10 h-10 rounded-full border-4 border-green-500 flex items-center justify-center text-white font-bold text-sm shadow-lg bg-gray-900">
                      {/* Assuming movie.vote_average is available here */}
                      {typeof movie.vote_average === "number" ? movie.vote_average.toFixed(1) : "N/A"}
                    </div>
                    <p className="text-lg font-semibold truncate">{movie.title}</p>
                    <p className="text-sm text-indigo-400">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="mb-12">
            <h2 className="text-4xl font-extrabold mb-8 border-b-4 border-indigo-600 inline-block pb-2">
              Trending Movies
            </h2>
            <div className="flex overflow-x-auto space-x-8 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800">
              {trending.map((movie) => (
                <div
                  key={movie.id}
                  className="min-w-[180px] cursor-pointer transform transition-transform hover:scale-110 hover:shadow-2xl rounded-lg overflow-hidden bg-gray-800"
                  title={movie.title}
                  onClick={() => handleMovieClick(movie.id)}
                >
                  {movie.poster_path ? (
                    <Image
                      src={posterBaseUrl + movie.poster_path}
                      alt={movie.title}
                      width={180}
                      height={270}
                      className="rounded-t-lg shadow-lg"
                      priority
                    />
                  ) : (
                    <div className="bg-gray-700 h-48 rounded-t-lg flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-lg font-semibold truncate">{movie.title}</p>
                    <p className="text-sm text-indigo-400">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-4xl font-extrabold mb-8 border-b-4 border-indigo-600 inline-block pb-2">
              Popular Movies
            </h2>
            <div className="flex overflow-x-auto space-x-8 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800">
              {popular.map((movie) => (
                <div
                  key={movie.id}
                  className="min-w-[180px] cursor-pointer transform transition-transform hover:scale-110 hover:shadow-2xl rounded-lg overflow-hidden bg-gray-800"
                  title={movie.title}
                  onClick={() => handleMovieClick(movie.id)}
                >
                  {movie.poster_path ? (
                    <Image
                      src={posterBaseUrl + movie.poster_path}
                      alt={movie.title}
                      width={180}
                      height={270}
                      className="rounded-t-lg shadow-lg"
                      priority
                    />
                  ) : (
                    <div className="bg-gray-700 h-48 rounded-t-lg flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-lg font-semibold truncate">{movie.title}</p>
                    <p className="text-sm text-indigo-400">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-4xl font-extrabold mb-8 border-b-4 border-indigo-600 inline-block pb-2">
              Upcoming Movies
            </h2>
            <div className="flex overflow-x-auto space-x-8 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800">
              {upcoming.map((movie) => (
                <div
                  key={movie.id}
                  className="min-w-[180px] cursor-pointer transform transition-transform hover:scale-110 hover:shadow-2xl rounded-lg overflow-hidden bg-gray-800"
                  title={movie.title}
                  onClick={() => handleMovieClick(movie.id)}
                >
                  {movie.poster_path ? (
                    <Image
                      src={posterBaseUrl + movie.poster_path}
                      alt={movie.title}
                      width={180}
                      height={270}
                      className="rounded-t-lg shadow-lg"
                      priority
                    />
                  ) : (
                    <div className="bg-gray-700 h-48 rounded-t-lg flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-lg font-semibold truncate">{movie.title}</p>
                    <p className="text-sm text-indigo-400">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
