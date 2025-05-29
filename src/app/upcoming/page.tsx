"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    <main className="p-8 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen">
      <h1 className="text-5xl font-extrabold mb-10 border-b-4 border-indigo-600 inline-block pb-3">
        Upcoming Movies
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {upcoming.map((movie) => (
          <div
            key={movie.id}
            className="cursor-pointer transform transition-transform hover:scale-105 hover:shadow-2xl rounded-lg overflow-hidden bg-gray-800"
            title={movie.title}
            onClick={() => handleMovieClick(movie.id)}
          >
            {movie.poster_path ? (
              <img
                src={posterBaseUrl + movie.poster_path}
                alt={movie.title}
                className="rounded-t-lg shadow-lg"
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
          </div>
        ))}
      </div>
    </main>
  );
}
