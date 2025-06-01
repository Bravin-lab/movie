"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface WatchlistItem {
  id: number;
  title: string;
  type: "movie" | "tv";
}

interface FavoriteItem {
  id: number;
  title: string;
  type: "movie" | "tv";
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
        setWatchlist(watchlistData || []);

        // Fetch favorites from Supabase
        const { data: favoritesData, error: favoritesError } = await supabase
          .from("favorites")
          .select("*")
          .eq("user_id", user.id);
        if (favoritesError) throw favoritesError;
        setFavorites(favoritesData || []);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ backgroundImage: "url('/25.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="text-gray-900 text-xl">Loading...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ backgroundImage: "url('/25.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="p-8 text-center text-red-500 bg-white bg-opacity-30 rounded shadow backdrop-blur-md backdrop-filter">
          User not logged in.
        </div>
      </div>
    );
  }

  return (
    <main className="p-8 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen max-w-screen-xl mx-auto rounded-lg shadow-xl">
      <h1 className="text-4xl font-extrabold mb-8">{userProfile.full_name}</h1>

      <section className="mb-12 bg-gray-800 bg-opacity-60 rounded-lg p-6 shadow-md backdrop-blur-sm">
        <h2 className="text-2xl font-semibold mb-6 border-b border-gray-700 pb-2">Profile</h2>
        <div className="flex items-center space-x-6">
          <label htmlFor="avatarUpload" className="cursor-pointer">
            {userProfile.avatar_url ? (
              <Image
                src={userProfile.avatar_url}
                alt={userProfile.full_name || "User"}
                width={96}
                height={96}
                className="rounded-full object-cover border-4 border-indigo-600 shadow-lg transition-transform hover:scale-105"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-3xl font-bold border-4 border-indigo-600 shadow-lg">
                {(userProfile.full_name || "U").charAt(0)}
              </div>
            )}
          </label>
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
          <div>
            <p className="text-xl font-semibold">{userProfile.full_name || "User"}</p>
            <p className="text-sm text-gray-400">{userProfile.email}</p>
          </div>
        </div>
      </section>

      <section className="mb-12 bg-gray-800 bg-opacity-60 rounded-lg p-6 shadow-md backdrop-blur-sm">
        <h2 className="text-2xl font-semibold mb-6 border-b border-gray-700 pb-2">Watchlist</h2>
        {watchlist.length === 0 ? (
          <p className="text-gray-400">Your watchlist is empty.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {watchlist.map(item => (
              <li key={item.id} className="flex justify-between items-center bg-gray-700 hover:bg-gray-600 transition rounded p-4 shadow-sm">
                <span className="font-medium">{item.title} <span className="text-sm text-gray-400">({item.type})</span></span>
                <button
                  onClick={() => removeFromWatchlist(item.id)}
                  className="text-red-500 hover:text-red-700 font-semibold"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      
      <section className="mb-12 bg-gray-800 bg-opacity-60 rounded-lg p-6 shadow-md backdrop-blur-sm">
        <h2 className="text-2xl font-semibold mb-6 border-b border-gray-700 pb-2">Favorites</h2>
        {favorites.length === 0 ? (
          <p className="text-gray-400">You have no favorite items.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {favorites.map(item => (
              <li key={item.id} className="flex justify-between items-center bg-gray-700 hover:bg-gray-600 transition rounded p-4 shadow-sm">
                <span className="font-medium">{item.title} <span className="text-sm text-gray-400">({item.type})</span></span>
                <button
                  onClick={() => removeFromFavorites(item.id)}
                  className="text-red-500 hover:text-red-700 font-semibold"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Additional sections like Recently Watched, Recommendations, Account Settings, etc. can be added here */}
    </main>
  );
}
