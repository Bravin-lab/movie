"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { getTrendingTVShows, searchTVShows } from "@/lib/tmdb";
import { FiSearch, FiX } from "react-icons/fi";

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
          Loading trending TV shows...
        </motion.div>
      </div>
    );
  }

  return (
    <main className="p-10 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white max-w-screen-xl mx-auto rounded-lg shadow-xl relative overflow-hidden">
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

      <h1 className="text-5xl font-extrabold mb-8 relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-text-flicker">
        Trending TV Shows
      </h1>
      <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-8 relative z-10">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search TV shows..."
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 relative z-10">
        {tvShows.map((show) => (
          <Link key={show.id} href={`/tv/${show.id}`} className="block rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1 hover:scale-105">
            {show.poster_path ? (
              <Image
                src={posterBaseUrl + show.poster_path}
                alt={show.name}
                width={200}
                height={300}
                className="w-full h-auto rounded-lg"
                priority
              />
            ) : (
              <div className="bg-gray-700 h-48 flex items-center justify-center text-gray-400 rounded-lg">
                No Image
              </div>
            )}
            <h2 className="mt-2 text-lg font-semibold truncate px-2">{show.name}</h2>
            <p className="text-sm text-gray-400 px-2">First Air Date: {show.first_air_date || "N/A"}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
