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
  backdrop_path: string | null;
  seasons?: {
    season_number: number;
    name: string;
  }[];
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
  const router = useRouter();

  const [youtubeVideoId, setYoutubeVideoId] = React.useState<string | null>(null);
  const [showYouTubePlayer, setShowYouTubePlayer] = React.useState(false);

  const { user } = useUser();

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

  const backdropUrl = tvShow.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tvShow.backdrop_path}` : null;

  return (
    <main className="text-white min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section with Backdrop */}
      <div
        className="relative min-h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: backdropUrl ? `url(${backdropUrl})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>

        {/* Glassmorphism Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 z-20 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl"
        >
          &larr; Back
        </button>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-screen px-6 py-20">
          {/* Poster */}
          <div className="flex-shrink-0 mb-8 lg:mb-0 lg:mr-12">
            {tvShow.poster_path ? (
              <div className="relative">
                <Image
                  src={posterBaseUrl + tvShow.poster_path}
                  alt={tvShow.name}
                  width={280}
                  height={420}
                  className="rounded-2xl shadow-2xl border-2 border-white/20"
                  priority
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ) : (
              <div className="bg-gray-700/50 backdrop-blur-sm h-96 w-64 rounded-2xl flex items-center justify-center text-gray-400 border border-white/20">
                No Image
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 max-w-4xl text-center lg:text-left">
            <h1 className="text-4xl lg:text-6xl font-extrabold mb-6 tracking-tight text-gray-300">
              {tvShow.name}
            </h1>

            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 mb-6">
              <p className="text-indigo-300 text-lg font-medium">
                {tvShow.first_air_date || "N/A"}
              </p>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                {tvShow.vote_average !== undefined && tvShow.vote_average !== null ? (
                  <>
                    <svg
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold">{tvShow.vote_average.toFixed(1)}</span>
                  </>
                ) : (
                  <span>N/A</span>
                )}
              </div>
            </div>

            <p className="mb-8 text-lg lg:text-xl leading-relaxed text-gray-200 max-w-3xl">
              {tvShow.overview}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative -mt-32 z-10 px-6 lg:px-10 pb-20">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {tvShow.seasons && tvShow.seasons.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Seasons</h2>
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
                <h2 className="text-2xl font-bold mb-4">Episodes</h2>
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
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Genres
            </h2>
            <div className="flex flex-wrap gap-3 mb-12">
              {tvShow.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 rounded-full text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:scale-105"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Cast
            </h2>
            <div className="flex overflow-x-auto space-x-6 pb-4">
              {tvShow.credits.cast.slice(0, 12).map((cast) => (
                <div key={cast.id} className="flex-shrink-0 w-32 text-center group">
                  <div className="relative mb-4">
                    {cast.profile_path ? (
                      <Image
                        src={posterBaseUrl + cast.profile_path}
                        alt={cast.name}
                        width={128}
                        height={192}
                        className="rounded-2xl shadow-lg border border-white/20 group-hover:scale-105 transition-transform duration-300"
                        priority
                      />
                    ) : (
                      <div className="bg-gray-700/50 backdrop-blur-sm h-48 w-32 rounded-2xl flex items-center justify-center text-gray-400 border border-white/20">
                        No Image
                      </div>
                    )}
                  </div>
                  <p className="text-base font-semibold truncate mb-1">{cast.name}</p>
                  <p className="text-sm text-gray-400 truncate">{cast.character}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <div className="flex flex-wrap gap-4">
                {user ? (
                  <WatchlistFavoriteButtons
                    itemId={tvShow.id}
                    itemType="tv"
                    title={tvShow.name}
                  />
                ) : (
                  <p className="text-gray-400">Please log in to add to watchlist or favorites.</p>
                )}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Trailer
              </h2>
              {youtubeVideoId ? (
                <div>
                  <button
                    onClick={toggleYouTubePlayer}
                    className="mb-6 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold flex items-center gap-3 justify-center shadow-lg shadow-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:scale-105"
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
                    <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                        title={`${tvShow.name} YouTube Trailer`}
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-lg text-center py-8">No trailer available.</p>
              )}
            </div>

            {selectedSeason !== null && selectedEpisode !== null && (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Watch Now
                </h2>
                <button
                  onClick={toggleStreamingPlayer}
                  className="mb-6 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold flex items-center gap-3 justify-center shadow-lg shadow-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-400 hover:scale-105"
                >
                  {showStreamingPlayer ? (
                    <>
                      <FaPlay className="animate-pulse" />
                      Hide Streaming Player
                    </>
                  ) : (
                    <>
                      <FaPlay className="animate-pulse" />
                      Play Episode
                    </>
                  )}
                </button>
                {showStreamingPlayer && (
                  <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                    <iframe
                      src={`/api/proxy-iframe?url=${encodeURIComponent(`https://vidsrc.xyz/embed/tv?tmdb=${tvShow.id}&season=${selectedSeason}&episode=${selectedEpisode}&ds_lang=de`)}`}
                      title={`Episode ${selectedEpisode} Player`}
                      className="w-full h-full border-0"
                      allowFullScreen
                      allow="autoplay; encrypted-media"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}