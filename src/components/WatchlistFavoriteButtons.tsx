import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface WatchlistFavoriteButtonsProps {
  itemId: number;
  itemType: "movie" | "tv";
  userId: string;
}

const WatchlistFavoriteButtons: React.FC<WatchlistFavoriteButtonsProps> = ({ itemId, itemType, userId }) => {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      setLoading(true);
      try {
        const { data: watchlistData, error: watchlistError } = await supabase
          .from("watchlist")
          .select("*")
          .eq("user_id", userId)
          .eq("item_id", itemId)
          .eq("item_type", itemType)
          .single();

        if (watchlistError && watchlistError.code !== "PGRST116") {
          console.error("Error fetching watchlist status:", watchlistError);
        } else {
          setIsInWatchlist(!!watchlistData);
        }

        const { data: favoriteData, error: favoriteError } = await supabase
          .from("favorites")
          .select("*")
          .eq("user_id", userId)
          .eq("item_id", itemId)
          .eq("item_type", itemType)
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
  }, [itemId, itemType, userId]);

  async function toggleWatchlist() {
    setLoading(true);
    try {
      if (isInWatchlist) {
        const { error } = await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", userId)
          .eq("item_id", itemId)
          .eq("item_type", itemType);
        if (error) throw error;
        setIsInWatchlist(false);
      } else {
        const { error } = await supabase
          .from("watchlist")
          .insert([{ user_id: userId, item_id: itemId, item_type: itemType }]);
        if (error) throw error;
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite() {
    setLoading(true);
    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("item_id", itemId)
          .eq("item_type", itemType);
        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert([{ user_id: userId, item_id: itemId, item_type: itemType }]);
        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-4">
      <button
        onClick={toggleWatchlist}
        disabled={loading}
        className={`px-4 py-2 rounded ${
          isInWatchlist ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
        } hover:bg-blue-700 transition`}
      >
        {isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
      </button>
      <button
        onClick={toggleFavorite}
        disabled={loading}
        className={`px-4 py-2 rounded ${
          isFavorite ? "bg-red-600 text-white" : "bg-gray-700 text-gray-300"
        } hover:bg-red-700 transition`}
      >
        {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
      </button>
    </div>
  );
};

export default WatchlistFavoriteButtons;
