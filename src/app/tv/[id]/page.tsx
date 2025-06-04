"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTVShowDetails, getTVShowSeasonDetails, Episode } from "@/lib/tmdb";
import { searchYouTubeTrailer } from "@/lib/youtube";
import { FaPlay } from "react-icons/fa";
import Image from "next/image";
import WatchlistFavoriteButtons from "@/components/WatchlistFavoriteButtons";
import { useUser } from "@/lib/UserContext";

interface TVShowDetails {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  credits: {
    cast: { id: number; name: string; character?: string; profile_path: string | null }[];
  };
  poster_path: string | null;
  seasons?: {
    season_number: number;
    name: string;
  }[];
  streamingUrl?: string;
}

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default function TVShowDetailsPage({ params }: Props) {
  const unwrappedParams = React.use(params);
  const [tvShow, setTVShow] = useState<TVShowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStreamingPlayer, setShowStreamingPlayer] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
  const [streamingUrl, setStreamingUrl] = useState<string | null>(null);
  const router = useRouter();

  const [youtubeVideoId, setYoutubeVideoId] = React.useState<string | null>(null);
  const [showYouTubePlayer, setShowYouTubePlayer] = React.useState(false);

  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    async function fetchDetails() {
      try {
        const data = await getTVShowDetails(Number(unwrappedParams.id));
        const tvShowDetails: TVShowDetails = {
          ...data,
          genres: (data as unknown as TVShowDetails).genres || [],
          seasons: (data as unknown as TVShowDetails).seasons || [],
        };
        setTVShow(tvShowDetails);
        if (tvShowDetails.seasons && tvShowDetails.seasons.length > 0) {
          setSelectedSeason(tvShowDetails.seasons[0].season_number);
        }
      } catch (error) {
        console.error("Failed to fetch TV show details", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [unwrappedParams.id]);
  
  useEffect(() => {
    async function fetchYouTubeTrailer() {
      if (tvShow && !youtubeVideoId) {
        try {
          const videoId = await searchYouTubeTrailer(tvShow.name + " trailer");
          setYoutubeVideoId(videoId);
        } catch (error) {
          console.error("Failed to fetch YouTube trailer", error);
          setYoutubeVideoId(null);
        }
      }
    }
    fetchYouTubeTrailer();
  }, [tvShow, youtubeVideoId]);

  function toggleYouTubePlayer() {
    setShowYouTubePlayer((prev) => !prev);
  }

  useEffect(() => {
    async function fetchEpisodes() {
      if (selectedSeason !== null && tvShow) {
        try {
          const seasonData = await getTVShowSeasonDetails(tvShow.id, selectedSeason);
          setEpisodes(seasonData.episodes || []);
          if (seasonData.episodes && seasonData.episodes.length > 0) {
            setSelectedEpisode(seasonData.episodes[0].episode_number);
          }
        } catch (error) {
          console.error("Failed to fetch season episodes", error);
          setEpisodes([]);
          setSelectedEpisode(null);
        }
      }
    }
    fetchEpisodes();
  }, [selectedSeason, tvShow]);

  useEffect(() => {
      if (tvShow && selectedSeason !== null && selectedEpisode !== null) {
        const url = `/api/proxy-stream?url=${encodeURIComponent(`https://vidsrc.xyz/embed/tv?tmdb=${tvShow.id}&season=${selectedSeason}&episode=${selectedEpisode}`)}`;
        setStreamingUrl(url);
      }
  }, [tvShow, selectedSeason, selectedEpisode]);

  if (loading) {
    return <div className="p-8 text-center text-gray-400 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen">Loading TV show details...</div>;
  }

  if (!tvShow) {
    return <div className="p-8 text-center text-red-500">TV show not found.</div>;
  }

  const posterBaseUrl = "https://image.tmdb.org/t/p/w300";

  function toggleStreamingPlayer() {
    setShowStreamingPlayer((prev) => !prev);
  }

  return (
    <main className="p-10 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen max-w-screen-xl mx-auto rounded-lg shadow-xl">
      <button
        onClick={() => router.back()}
        className="mb-8 px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition font-semibold"
      >
        &larr; Back
      </button>

      <div className="flex flex-col lg:flex-row gap-12">
        {tvShow.poster_path ? (
          <Image
            src={posterBaseUrl + tvShow.poster_path}
            alt={tvShow.name}
            width={300}
            height={450}
            className="rounded-lg shadow-2xl w-full lg:w-1/3"
            priority
          />
        ) : (
          <div className="bg-gray-700 h-72 rounded-lg flex items-center justify-center text-gray-400 w-full lg:w-1/3">
            No Image
          </div>
        )}

        <div className="flex-1 max-w-full overflow-x-auto">
          <h1 className="text-6xl font-extrabold mb-8 tracking-tight">{tvShow.name}</h1>
          <p className="text-indigo-400 mb-5 text-lg flex items-center gap-4">
            First Air Date: {tvShow.first_air_date || "N/A"} | 
            <span className="flex items-center gap-2">
              User Score:
              {tvShow.vote_average !== undefined && tvShow.vote_average !== null ? (
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    className="text-gray-700"
                    stroke="currentColor"
                    strokeWidth="3"
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                  />
                  <circle
                    className="text-green-500"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    strokeDasharray="94.2"
                    strokeDashoffset={94.2 - (tvShow.vote_average / 10) * 94.2}
                    style={{ transition: "stroke-dashoffset 0.5s ease" }}
                  />
                  <text
                    x="18"
                    y="22"
                    textAnchor="middle"
                    fontSize="10"
                    fill="white"
                    fontWeight="bold"
                  >
                    {tvShow.vote_average.toFixed(1)}
                  </text>
                </svg>
              ) : (
                <span>N/A</span>
              )}
            </span>
          </p>
          <p className="mb-8 text-xl leading-relaxed">{tvShow.overview}</p>

          <h2 className="text-4xl font-bold mb-6">Genres</h2>
          <ul className="flex flex-wrap gap-4 mb-12">
            {tvShow.genres.map((genre) => (
              <li
                key={genre.id}
                className="bg-indigo-600 px-5 py-2 rounded-full text-base font-semibold"
              >
                {genre.name}
              </li>
            ))}
          </ul>

          <h2 className="text-4xl font-bold mb-6">Cast</h2>
          <div className="flex overflow-x-auto space-x-8 mb-14">
            {tvShow.credits.cast.slice(0, 10).map((cast) => (
              <div key={cast.id} className="min-w-[120px] text-center">
                {cast.profile_path ? (
                  <Image
                    src={posterBaseUrl + cast.profile_path}
                    alt={cast.name}
                    width={96}
                    height={128}
                    className="rounded-lg mx-auto mb-3 shadow-lg"
                    priority
                  />
                ) : (
                  <div className="bg-gray-700 h-32 w-24 rounded-lg mx-auto mb-3 flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
                <p className="text-base font-semibold truncate">{cast.name}</p>
                <p className="text-sm text-gray-400 truncate">{cast.character}</p>
              </div>
            ))}
          </div>

          {tvShow.seasons && tvShow.seasons.length > 0 && (
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-6">Seasons</h2>
              <select
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 mb-6"
                value={selectedSeason || ""}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
              >
                {tvShow.seasons.map((season) => (
                  <option key={season.season_number} value={season.season_number} title={season.name}>
                    {season.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {episodes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-6">Episodes</h2>
              <select
                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={selectedEpisode || ""}
                onChange={(e) => setSelectedEpisode(Number(e.target.value))}
              >
                {episodes.map((episode) => (
                  <option key={episode.id} value={episode.episode_number} title={episode.name}>
                    Episode {episode.episode_number}: {episode.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {youtubeVideoId ? (
            <div>
              <h2 className="text-4xl font-bold mb-6">Trailer</h2>
              <button
                onClick={toggleYouTubePlayer}
                className="mb-4 px-8 py-3 bg-indigo-600 rounded-full hover:bg-indigo-700 transition font-semibold flex items-center gap-3 justify-center shadow-lg shadow-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {showYouTubePlayer ? (
                  <>
                    <FaPlay className="animate-pulse" />
                    Hide Trailer
                  </>
                ) : (
                  <>
                    <FaPlay className="animate-pulse" />
                    Play Trailer
                  </>
                )}
              </button>
              {showYouTubePlayer && (
                <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-2xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                    title={`${tvShow.name} YouTube Trailer`}
                    allowFullScreen
                    className="w-full h-72 md:h-96"
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-lg">No trailer available.</p>
          )}

          {streamingUrl && (
            <div>
              <h2 className="text-4xl font-bold mb-6">Watch Now</h2>
              <button
                onClick={toggleStreamingPlayer}
                className="mb-4 px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition font-semibold flex items-center gap-2"
              >
                {showStreamingPlayer ? (
                  <>
                    <FaPlay />
                    Hide Streaming Player
                  </>
                ) : (
                  <>
                    <FaPlay />
                    Play Episode
                  </>
                )}
              </button>
              {showStreamingPlayer && (
                <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-2xl">
                  <iframe
                    src={streamingUrl}
                    allowFullScreen
                    className="w-full h-72 md:h-96"
                    title={`Episode ${selectedEpisode} Player`}
                  />
                </div>
              )}
            </div>
          )}
          <div className="flex gap-4 mb-8">
            {!userLoading && user ? (
              <WatchlistFavoriteButtons
                itemId={tvShow.id}
                itemType="tv"
                userId={user.id}
                title={tvShow.name}
              />
            ) : (
              <p className="text-gray-400">Please log in to add to watchlist or favorites.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
