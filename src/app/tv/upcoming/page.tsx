"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getUpcomingTVShows } from "@/lib/tmdb";

interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
}

export default function UpcomingTVShowsPage() {
  const [tvShows, setTVShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const data = await getUpcomingTVShows();
        setTVShows(data.results);
      } catch (error) {
        console.error("Failed to fetch upcoming TV shows", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUpcoming();
  }, []);

  const posterBaseUrl = "https://image.tmdb.org/t/p/w200";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20"></div>
        <div className="text-xl relative z-10">Loading upcoming TV shows...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full p-10 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      <h1 className="text-5xl font-bold mb-8">Upcoming TV Shows</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
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
              <p className="text-sm text-gray-500 px-2">First Air Date: {show.first_air_date || "N/A"}</p>
            </a>
          </Link>
        ))}
      </div>
    </main>
  );
}
