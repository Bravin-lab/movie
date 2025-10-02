"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import * as tmdb from "@/lib/tmdb";
import { FiSearch, FiX } from "react-icons/fi";

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
          const trendingData = await tmdb.getTrendingMovies();
          const popularData = await tmdb.getPopularMovies();
          const upcomingData = await tmdb.getUpcomingMovies();

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-white text-xl animate-pulse relative z-10"
        >
          Loading movies...
        </motion.div>
      </div>
    );
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
      const data = await tmdb.searchMovies(searchQuery.trim());
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
    <main className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20"></div>
      <motion.div
        className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity }}
      ></motion.div>
      <motion.div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 5, repeat: Infinity }}
      ></motion.div>
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      ></motion.div>

      <div className="relative p-8 max-w-7xl mx-auto">
      <header
        className="mb-12 text-center bg-cover bg-center bg-no-repeat p-6 sm:p-12 rounded-lg relative overflow-hidden"
        style={{ backgroundImage: trending.length > 0 ? `url(https://image.tmdb.org/t/p/original${trending[Math.floor(Math.random() * trending.length)].poster_path})` : undefined }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-black opacity-80"></div>
        <h1 className="relative text-4xl sm:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-text-flicker">
          Welcome.
        </h1>
        <p className="relative text-lg sm:text-2xl max-w-xl mx-auto mb-6 text-gray-300 drop-shadow-lg">
          Millions of movies, TV shows and people to discover. Explore now.
        </p>
        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 relative z-10">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search movies, TV shows, people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-md sm:rounded-l-md border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 pr-10"
            />
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
                aria-label="Clear search"
              >
                <FiX size={18} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 rounded-md sm:rounded-r-md hover:bg-indigo-700 transition"
          >
            Search
          </button>
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
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="min-w-[180px] cursor-pointer rounded-lg overflow-hidden bg-gray-800 shadow-lg"
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
                      {typeof movie.vote_average === "number" ? movie.vote_average.toFixed(1) : "N/A"}
                    </div>
                    <p className="text-lg font-semibold truncate">{movie.title}</p>
                    <p className="text-sm text-indigo-400">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="mb-12">
            <h2 className="text-4xl font-extrabold mb-8 border-indigo-600 inline-block pb-2">
              Trending Movies
            </h2>
            <div className="flex overflow-x-auto space-x-8 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800">
              {trending.map((movie) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="min-w-[180px] cursor-pointer rounded-lg overflow-hidden bg-gray-800 shadow-lg"
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
                </motion.div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-4xl font-extrabold mb-8 border-indigo-600 inline-block pb-2">
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
            <h2 className="text-4xl font-extrabold mb-8 border-indigo-600 inline-block pb-2">
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
      </div>
    </main>
  );
}
