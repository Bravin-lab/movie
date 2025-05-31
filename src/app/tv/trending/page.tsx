"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getTrendingTVShows, searchTVShows } from "@/lib/tmdb";

interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
}

export default function TrendingTVShowsPage() {
  const [tvShows, setTVShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const data = await getTrendingTVShows();
        setTVShows(data.results);
      } catch (error) {
        console.error("Failed to fetch trending TV shows", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrending();
  }, []);

  const posterBaseUrl = "https://image.tmdb.org/t/p/w200";

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length === 0) {
      setIsSearching(false);
      // Reload trending shows if search cleared
      setLoading(true);
      try {
        const data = await getTrendingTVShows();
        setTVShows(data.results);
      } catch (error) {
        console.error("Failed to fetch trending TV shows", error);
      } finally {
        setLoading(false);
      }
      return;
    }
    setIsSearching(true);
    setLoading(true);
    try {
      const data = await searchTVShows(searchQuery.trim());
      setTVShows(data.results);
    } catch (error) {
      console.error("Failed to search TV shows", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = async () => {
    setSearchQuery("");
    setIsSearching(false);
    setLoading(true);
    try {
      const data = await getTrendingTVShows();
      setTVShows(data.results);
    } catch (error) {
      console.error("Failed to fetch trending TV shows", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen">Loading trending TV shows...</div>;
  }

  return (
    <main className="p-10 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white max-w-screen-xl mx-auto rounded-lg shadow-xl">
      <h1 className="text-5xl font-bold mb-8">Trending TV Shows</h1>
      <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-8">
        <input
          type="text"
          placeholder="Search TV shows..."
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {tvShows.map((show) => (
          <Link key={show.id} href={`/tv/${show.id}`} className="block rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition">
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
          </Link>
        ))}
      </div>
    </main>
  );
}
