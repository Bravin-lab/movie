"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import * as tmdb from "@/lib/tmdb";
import GenreDropdown from "@/components/GenreDropdown";
import { FiSearch, FiX } from "react-icons/fi";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average?: number;
}

interface Genre {
  id: number;
  name: string;
}

export default function HomePage() {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchGenres() {
      try {
        const genreData = await tmdb.fetchGenres();
        setGenres(genreData.genres);
      } catch (error) {
        console.error("Failed to fetch genres", error);
      }
    }
    fetchGenres();
  }, []);

  useEffect(() => {
    if (!isSearching) {
      async function fetchMovies() {
        try {
          if (selectedGenre !== null) {
            const genreId = selectedGenre;
            const trendingData = await tmdb.discoverMoviesByGenre(genreId);
            const popularData = await tmdb.discoverMoviesByGenre(genreId);
            const upcomingData = await tmdb.getUpcomingMovies();

            setTrending(trendingData.results);
            setPopular(popularData.results);
            setUpcoming(upcomingData.results);
          } else {
            const trendingData = await tmdb.getTrendingMovies();
            const popularData = await tmdb.getPopularMovies();
            const upcomingData = await tmdb.getUpcomingMovies();

            setTrending(trendingData.results);
            setPopular(popularData.results);
            setUpcoming(upcomingData.results);
          }
        } catch (error) {
          console.error("Failed to fetch movies", error);
        } finally {
          setLoading(false);
        }
      }
      fetchMovies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearching, JSON.stringify(selectedGenre)]);

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

  // Removed unused handleGenreChange function to fix lint error

  const moviesToDisplay = isSearching ? searchResults : (selectedGenre !== null ? trending : []);

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

      {/* Particle Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{
              y: [null, -100],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      <div className="relative w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <header
          className="relative min-h-[calc(100vh-9rem)] w-full overflow-hidden rounded-3xl bg-cover bg-center bg-no-repeat shadow-2xl shadow-purple-950/30"
          style={{ backgroundImage: trending.length > 0 ? `url(https://image.tmdb.org/t/p/original${trending[Math.floor(Math.random() * trending.length)].poster_path})` : undefined }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950/95 via-indigo-950/85 to-black/95"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.22),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.18),_transparent_30%)]"></div>

          <div className="relative z-10 flex min-h-[inherit] flex-col justify-center px-4 py-10 sm:px-8 lg:px-16">
            <div className="max-w-4xl">
              <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 animate-text-flicker sm:text-6xl lg:text-7xl">
                Welcome.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-gray-200 drop-shadow-lg sm:text-xl lg:text-2xl">
                Millions of movies, TV shows and people to discover. Explore now.
              </p>

              <form onSubmit={handleSearchSubmit} className="mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search movies, TV shows, people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 pr-11 text-white shadow-lg shadow-black/20 outline-none backdrop-blur-sm transition placeholder:text-gray-400 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30"
                  />
                  <FiSearch className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-white"
                      aria-label="Clear search"
                    >
                      <FiX size={18} />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-950/30 transition hover:from-indigo-400 hover:to-cyan-400 sm:w-auto"
                >
                  Search
                </button>
              </form>

              <div className="mt-8 max-w-2xl">
                <label htmlFor="genre-select" className="mb-3 block text-base font-semibold text-white sm:text-lg">
                  🎬 Filter by Genre
                </label>
                <GenreDropdown
                  genres={genres}
                  selectedGenre={selectedGenre}
                  onChange={(genreId) => setSelectedGenre(genreId)}
                />
              </div>
            </div>
          </div>
        </header>

      {isSearching ? (
        <section className="mt-10">
          <h2 className="text-3xl font-extrabold mb-6 border-b-4 border-indigo-600 inline-block pb-2 sm:text-4xl">
            Search Results
          </h2>
          {moviesToDisplay.length === 0 ? (
            <p className="text-center text-gray-400">No results found.</p>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800">
              {moviesToDisplay.map((movie) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="min-w-[160px] cursor-pointer overflow-hidden rounded-2xl bg-gray-800 shadow-lg sm:min-w-[180px]"
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
                </motion.div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="mt-10 mb-12 px-4 sm:px-0">
            <h2 className="text-3xl font-extrabold mb-6 border-b-4 border-indigo-600 inline-block pb-2 sm:text-4xl">
              Trending Movies
            </h2>
            <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800">
              {trending.map((movie) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="min-w-[160px] cursor-pointer overflow-hidden rounded-2xl bg-gray-800 shadow-lg sm:min-w-[180px]"
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

          <section className="mb-12 px-4 sm:px-0">
            <h2 className="text-3xl font-extrabold mb-6 border-b-4 border-indigo-600 inline-block pb-2 sm:text-4xl">
              Popular Movies
            </h2>
            <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800">
              {popular.map((movie) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="min-w-[160px] cursor-pointer overflow-hidden rounded-2xl bg-gray-800 shadow-lg sm:min-w-[180px]"
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

          <section className="mb-12 px-4 sm:px-0">
            <h2 className="text-3xl font-extrabold mb-6 border-b-4 border-indigo-600 inline-block pb-2 sm:text-4xl">
              Upcoming Movies
            </h2>
            <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-gray-800">
              {upcoming.map((movie) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="min-w-[160px] cursor-pointer overflow-hidden rounded-2xl bg-gray-800 shadow-lg sm:min-w-[180px]"
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
        </>
      )}
      </div>
    </main>
  );
}
