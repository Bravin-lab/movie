"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import * as tmdb from "@/lib/tmdb";

interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
}

export default function PopularTVShowsPage() {
  const [tvShows, setTVShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPopular() {
      try {
        const data = await tmdb.getPopularTVShows();
        setTVShows(data.results);
      } catch (error) {
        console.error("Failed to fetch popular TV shows", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPopular();
  }, []);

  const posterBaseUrl = "https://image.tmdb.org/t/p/w200";

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading popular TV shows...</div>;
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold sm:text-5xl">Popular TV Shows</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
        {tvShows.map((show) => (
          <Link key={show.id} href={`/tv/${show.id}`}>
            <a className="block rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition">
              {show.poster_path ? (
                <Image
                  src={posterBaseUrl + show.poster_path}
                  alt={show.name}
                  width={200}
                  height={300}
                  className="w-full h-auto"
                  priority
                />
              ) : (
                <div className="bg-gray-700 h-48 flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
              <h2 className="mt-2 text-lg font-semibold truncate px-2">{show.name}</h2>
              <p className="text-sm text-gray-400 px-2">First Air Date: {show.first_air_date || "N/A"}</p>
            </a>
          </Link>
        ))}
        </div>
      </div>
    </main>
  );
}
