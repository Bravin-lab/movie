"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import * as tmdb from "@/lib/tmdb";
import { FiTrash2, FiHeart, FiBookmark, FiUser, FiStar } from "react-icons/fi";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface WatchlistItem {
  id: number;
  movie_id: number;
  title: string;
  type: "movie" | "tv";
  poster_path?: string | null;
}

interface FavoriteItem {
  id: number;
  movie_id: number;
  title: string;
  type: "movie" | "tv";
  poster_path?: string | null;
}

export default function UserDashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch user profile from user_profiles table
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("id, FullName, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          setUserProfile({
            id: user.id,
            full_name: user.user_metadata.full_name || user.email || "User",
            email: user.email || null,
            avatar_url: user.user_metadata.avatar_url ?? null,
          });
        } else {
          setUserProfile({
            id: profileData.id,
            full_name: profileData.FullName && profileData.FullName.trim() !== "" ? profileData.FullName : "User",
            email: user.email || null,
            avatar_url: profileData.avatar_url ?? null,
          });
        }

        // Fetch watchlist from Supabase
        const { data: watchlistData, error: watchlistError } = await supabase
          .from("watchlist")
          .select("*")
          .eq("user_id", user.id);
        if (watchlistError) throw watchlistError;

        // Fetch favorites from Supabase
        const { data: favoritesData, error: favoritesError } = await supabase
          .from("favorites")
          .select("*")
          .eq("user_id", user.id);
        if (favoritesError) throw favoritesError;

        // Fetch poster paths for watchlist items
        const watchlistWithPosters = await Promise.all(
          (watchlistData || []).map(async (item: WatchlistItem) => {
            try {
              if (item.type === "movie") {
                const details = await tmdb.getMovieDetails(item.movie_id);
                return { ...item, poster_path: details.poster_path };
              } else if (item.type === "tv") {
                const details = await tmdb.getTVShowDetails(item.movie_id);
                return { ...item, poster_path: details.poster_path };
              }
              return item;
            } catch (error) {
              console.error("Error fetching watchlist item details:", error);
              return item;
            }
          })
        );

        // Fetch poster paths for favorite items
        const favoritesWithPosters = await Promise.all(
          (favoritesData || []).map(async (item: FavoriteItem) => {
            try {
              if (item.type === "movie") {
                const details = await tmdb.getMovieDetails(item.movie_id);
                return { ...item, poster_path: details.poster_path };
              } else if (item.type === "tv") {
                const details = await tmdb.getTVShowDetails(item.movie_id);
                return { ...item, poster_path: details.poster_path };
              }
              return item;
            } catch (error) {
              console.error("Error fetching favorite item details:", error);
              return item;
            }
          })
        );

        setWatchlist(watchlistWithPosters);
        setFavorites(favoritesWithPosters);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, []);

  const removeFromWatchlist = async (id: number) => {
    if (!userProfile) return;
    try {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("id", id)
        .eq("user_id", userProfile.id);
      if (error) throw error;
      setWatchlist(watchlist.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error removing from watchlist:", error);
    }
  };

  const removeFromFavorites = async (id: number) => {
    if (!userProfile) return;
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", id)
        .eq("user_id", userProfile.id);
      if (error) throw error;
      setFavorites(favorites.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error removing from favorites:", error);
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
          Loading...
        </motion.div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-8 text-center text-red-400 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 relative z-10"
        >
          User not logged in.
        </motion.div>
      </div>
    );
  }

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
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            Welcome back, {userProfile.full_name}
          </h1>
          <p className="text-xl text-gray-300">Manage your watchlist and favorites</p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12 bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-purple-400"></div>
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent flex items-center">
            <FiUser className="mr-3" /> Profile
          </h2>
          <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
            <motion.label
              htmlFor="avatarUpload"
              className="cursor-pointer relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {userProfile.avatar_url ? (
                <div className="relative">
                  <Image
                    src={userProfile.avatar_url}
                    alt={userProfile.full_name || "User"}
                    width={120}
                    height={120}
                    className="rounded-full object-cover border-4 border-cyan-400 shadow-2xl"
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-pulse"></div>
                </div>
              ) : (
                <div className="w-30 h-30 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center text-white text-4xl font-bold border-4 border-white/20 shadow-2xl">
                  {(userProfile.full_name || "U").charAt(0)}
                </div>
              )}
            </motion.label>
            <input
              type="file"
              id="avatarUpload"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                if (!e.target.files || e.target.files.length === 0) return;
                const file = e.target.files[0];
                const userId = userProfile?.id;
                if (!userId) return;

                const formData = new FormData();
                formData.append("file", file);
                formData.append("userId", userId);

                try {
                  const response = await fetch("/api/upload-avatar", {
                    method: "POST",
                    body: formData,
                  });

                  let data;
                  try {
                    data = await response.clone().json();
                  } catch {
                    const text = await response.text();
                    console.error("Error uploading avatar: Response is not JSON:", text);
                    return;
                  }

                  if (!response.ok) {
                    console.error("Error uploading avatar:", data.error);
                    return;
                  }

                  setUserProfile((prev) =>
                    prev ? { ...prev, avatar_url: data.publicUrl } : prev
                  );
                } catch (error) {
                  console.error("Error uploading avatar:", error);
                }
              }}
            />
            <div className="text-center md:text-left">
              <p className="text-2xl font-bold text-white mb-2">{userProfile.full_name || "User"}</p>
              <p className="text-sm text-gray-300 mb-4">{userProfile.email}</p>
              <div className="flex space-x-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyan-400">{watchlist.length}</p>
                  <p className="text-xs text-gray-400">Watchlist</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{favorites.length}</p>
                  <p className="text-xs text-gray-400">Favorites</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-12 bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20"
        >
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent flex items-center">
            <FiBookmark className="mr-3" /> Watchlist
          </h2>
          {watchlist.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Your watchlist is empty.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {watchlist.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10 hover:border-cyan-400/50 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    {item.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                        alt={item.title}
                        width={60}
                        height={90}
                        className="rounded-lg shadow-md"
                      />
                    ) : (
                      <div className="w-15 h-22 bg-gray-600 rounded-lg flex items-center justify-center text-gray-400 text-xs font-semibold">
                        No Image
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-white truncate">{item.title}</h3>
                      <p className="text-sm text-gray-400 capitalize">{item.type}</p>
                    </div>
                    <motion.button
                      onClick={() => removeFromWatchlist(item.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-red-400/20 transition-colors"
                    >
                      <FiTrash2 size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-12 bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20"
        >
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent flex items-center">
            <FiHeart className="mr-3" /> Favorites
          </h2>
          {favorites.length === 0 ? (
            <p className="text-gray-400 text-center py-8">You have no favorite items.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10 hover:border-purple-400/50 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    {item.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                        alt={item.title}
                        width={60}
                        height={90}
                        className="rounded-lg shadow-md"
                      />
                    ) : (
                      <div className="w-15 h-22 bg-gray-600 rounded-lg flex items-center justify-center text-gray-400 text-xs font-semibold">
                        No Image
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-white truncate">{item.title}</h3>
                      <p className="text-sm text-gray-400 capitalize">{item.type}</p>
                    </div>
                    <motion.button
                      onClick={() => removeFromFavorites(item.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-red-400/20 transition-colors"
                    >
                      <FiTrash2 size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-12 bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20"
        >
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent flex items-center">
            <FiStar className="mr-3" /> Suggestions
          </h2>
          {/* Placeholder suggestions - can be replaced with real logic */}
          {watchlist.length === 0 && favorites.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No suggestions available. Add items to your watchlist or favorites to get suggestions.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...watchlist.slice(0, 2), ...favorites.slice(0, 2)].map((item, index) => (
                <motion.div
                  key={`suggest-${item.id}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10 hover:border-pink-400/50 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    {item.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                        alt={item.title}
                        width={60}
                        height={90}
                        className="rounded-lg shadow-md"
                      />
                    ) : (
                      <div className="w-15 h-22 bg-gray-600 rounded-lg flex items-center justify-center text-gray-400 text-xs font-semibold">
                        No Image
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-white truncate">{item.title}</h3>
                      <p className="text-sm text-gray-400 capitalize">{item.type}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}
