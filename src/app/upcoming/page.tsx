"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { getUpcomingMovies } from "@/lib/tmdb";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
}

export default function UpcomingPage() {
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const data = await getUpcomingMovies();
        setUpcoming(data.results);
      } catch (error) {
        console.error("Failed to fetch upcoming movies", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUpcoming();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-400 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen">Loading upcoming movies...</div>;
  }

  const posterBaseUrl = "https://image.tmdb.org/t/p/w300";

  function handleMovieClick(id: number) {
    router.push(`/movie/${id}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <main className="p-10 text-white max-w-screen-xl mx-auto rounded-lg shadow-xl relative overflow-hidden">
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

      <h1 className="text-5xl font-extrabold mb-10 border-b-4 border-indigo-600 inline-block pb-3 relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-text-flicker">
        Upcoming Movies
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 relative z-10">
        {upcoming.map((movie) => (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="cursor-pointer rounded-lg overflow-hidden bg-gray-800 shadow-lg"
            title={movie.title}
            onClick={() => handleMovieClick(movie.id)}
          >
            {movie.poster_path ? (
              <Image
                src={posterBaseUrl + movie.poster_path}
                alt={movie.title}
                width={300}
                height={450}
                className="rounded-t-lg shadow-lg"
                priority
              />
            ) : (
              <div className="bg-gray-700 h-64 rounded-t-lg flex items-center justify-center text-gray-400">
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
    </main>
    </div>
  );
}
