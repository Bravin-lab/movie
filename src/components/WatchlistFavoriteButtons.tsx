import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
import { supabase } from "@/lib/supabaseClient";
import { FiBookmark, FiHeart } from "react-icons/fi";

interface WatchlistFavoriteButtonsProps {
  itemId: number;
  itemType: "movie" | "tv";
  userId?: string;
  title: string;
}

const WatchlistFavoriteButtons: React.FC<WatchlistFavoriteButtonsProps> = ({ itemId, itemType, userId, title }) => {
  const { user } = useUser();
  const router = useRouter();

  const effectiveUserId = userId || user?.id;
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!effectiveUserId) return;

    async function fetchStatus() {
      setLoading(true);
      try {
        const { data: watchlistData, error: watchlistError } = await supabase
          .from("watchlist")
          .select("*")
          .eq("user_id", effectiveUserId)
          .eq("movie_id", itemId)
          .eq("type", itemType)
          .single();

        if (watchlistError && watchlistError.code !== "PGRST116") {
          console.error("Error fetching watchlist status:", watchlistError);
        } else {
          setIsInWatchlist(!!watchlistData);
        }

        const { data: favoriteData, error: favoriteError } = await supabase
          .from("favorites")
          .select("*")
          .eq("user_id", effectiveUserId)
          .eq("movie_id", itemId)
          .eq("type", itemType)
          .single();

        if (favoriteError && favoriteError.code !== "PGRST116") {
          console.error("Error fetching favorite status:", favoriteError);
        } else {
          setIsFavorite(!!favoriteData);
        }
      } catch (error) {
        console.error("Error fetching statuses:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, [itemId, itemType, effectiveUserId]);

  if (!effectiveUserId) {
    return (
      <div className="flex gap-4">
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 px-4 py-2 rounded bg-gray-700 text-gray-300 hover:bg-blue-700 transition"
        >
          <FiBookmark className="text-gray-300" size={20} />
          Login to Add to Watchlist
        </button>
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 px-4 py-2 rounded bg-gray-700 text-gray-300 hover:bg-red-700 transition"
        >
          <FiHeart className="text-gray-300" size={20} />
          Login to Add to Favorites
        </button>
      </div>
    );
  }

  console.log("WatchlistFavoriteButtons title prop:", title);

  async function toggleWatchlist() {
    setLoading(true);
    try {
      if (!title) {
        console.error("Cannot insert watchlist item: title is null or empty");
        setLoading(false);
        return;
      }
      if (isInWatchlist) {
        const { error } = await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", effectiveUserId)
          .eq("movie_id", itemId)
          .eq("type", itemType);
        if (error) throw error;
        setIsInWatchlist(false);
      } else {
        const { error } = await supabase
          .from("watchlist")
          .insert([{ user_id: effectiveUserId, movie_id: itemId, type: itemType, title }]);
        if (error) throw error;
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error("Error toggling watchlist:", JSON.stringify(error), { effectiveUserId, itemId, itemType, title });
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite() {
    setLoading(true);
    try {
      if (!title) {
        console.error("Cannot insert favorite item: title is null or empty");
        setLoading(false);
        return;
      }
      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", effectiveUserId)
          .eq("movie_id", itemId)
          .eq("type", itemType);
        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert([{ user_id: effectiveUserId, movie_id: itemId, type: itemType, title }]);
        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", JSON.stringify(error), { effectiveUserId, itemId, itemType, title });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-4">
      <button
        onClick={toggleWatchlist}
        disabled={loading}
        aria-label={isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
        className={`flex items-center gap-2 px-4 py-2 rounded ${
          isInWatchlist ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
        } hover:bg-blue-700 transition`}
      >
        <FiBookmark className={isInWatchlist ? "text-white" : "text-gray-300"} size={20} />
        {isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
      </button>
      <button
        onClick={toggleFavorite}
        disabled={loading}
        aria-label={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        className={`flex items-center gap-2 px-4 py-2 rounded ${
          isFavorite ? "bg-red-600 text-white" : "bg-gray-700 text-gray-300"
        } hover:bg-red-700 transition`}
      >
        <FiHeart className={isFavorite ? "text-white" : "text-gray-300"} size={20} />
        {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
      </button>
    </div>
  );
};

export default WatchlistFavoriteButtons;
