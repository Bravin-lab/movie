"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getMovieDetails } from "@/lib/tmdb";
import { searchYouTubeTrailer } from "@/lib/youtube";

import { FaPlay } from "react-icons/fa";
import WatchlistFavoriteButtons from "@/components/WatchlistFavoriteButtons";
import ProxyVideoPlayer from "@/components/ProxyVideoPlayer";
import { useUser } from "@/lib/UserContext";

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  credits: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
  };
  videos: {
    results: { id: string; key: string; name: string; site: string; type: string }[];
  };
  poster_path: string | null;
  backdrop_path: string | null;
  streamingUrl?: string;
};

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default function MovieDetailsPage({ params }: Props) {
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showYouTubePlayer, setShowYouTubePlayer] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [showStreamingPlayer, setShowStreamingPlayer] = useState(false);
  const router = useRouter();

  const { user } = useUser();

  React.useEffect(() => {
    async function fetchDetails() {
      try {
        const unwrappedParams = await params;
        const data = await getMovieDetails(Number(unwrappedParams.id));

        // Get streaming URL from vidsrc
        const targetUrl = `https://vidsrc.xyz/embed/movie?tmdb=${data.id}`;
        const streamingUrl = `/api/proxy-stream?url=${encodeURIComponent(targetUrl)}`;

        setMovie({ ...data, streamingUrl } as MovieDetails);
      } catch (error) {
        console.error("Failed to fetch movie details", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [params]);


  React.useEffect(() => {
    async function fetchYouTubeTrailer() {
      if (movie && !movie.videos?.results.find(
        (video) =>
          (video.site === "YouTube" || video.site === "Vimeo") &&
          (video.type === "Trailer" || video.type === "Teaser")
      )) {
        try {
          const videoId = await searchYouTubeTrailer(movie.title + " trailer");
          setYoutubeVideoId(videoId);
        } catch (error) {
          console.error("Failed to fetch YouTube trailer", error);
          setYoutubeVideoId(null);
        }
      }
    }
    fetchYouTubeTrailer();
  }, [movie]);

  if (loading) {
    return <div className="p-8 text-center text-gray-400 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen">Loading movie details...</div>;
  }

  if (!movie) {
    return <div className="p-8 text-center text-red-500">Movie not found.</div>;
  }

  const posterBaseUrl = "https://image.tmdb.org/t/p/w300";

  const trailer = movie.videos?.results.find(
    (video) =>
      (video.site === "YouTube" || video.site === "Vimeo") &&
      (video.type === "Trailer" || video.type === "Teaser")
  );

  function toggleYouTubePlayer() {
    setShowYouTubePlayer((prev) => !prev);
  }

  function toggleStreamingPlayer() {
    setShowStreamingPlayer((prev) => !prev);
  }

  const backdropUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null;

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
            {movie.poster_path ? (
              <div className="relative">
                <Image
                  src={posterBaseUrl + movie.poster_path}
                  alt={movie.title}
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
            <h1 className="text-4xl lg:text-6xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent">
              {movie.title}
            </h1>

            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 mb-6">
              <p className="text-indigo-300 text-lg font-medium">
                {movie.release_date || "N/A"}
              </p>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                {movie.vote_average !== undefined && movie.vote_average !== null ? (
                  <>
                    <svg
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                  </>
                ) : (
                  <span>N/A</span>
                )}
              </div>
            </div>

            <p className="mb-8 text-lg lg:text-xl leading-relaxed text-gray-200">
              {movie.overview}
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
              {movie.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative -mt-32 z-10 px-6 lg:px-10 pb-20">
        <div className="max-w-7xl mx-auto space-y-12">


          {/* Cast Section */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Cast
            </h2>
            <div className="flex overflow-x-auto space-x-6 pb-4">
              {movie.credits.cast.slice(0, 12).map((cast) => (
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
          </div>

          {/* Actions Section */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex flex-wrap gap-4">
              {user ? (
                <WatchlistFavoriteButtons
                  itemId={movie.id}
                  itemType="movie"
                  title={movie.title}
                />
              ) : (
                <p className="text-gray-400">Please log in to add to watchlist or favorites.</p>
              )}
            </div>
          </div>

          {/* Trailer Section */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Trailer
            </h2>
            {trailer ? (
              <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  title={trailer.name}
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : youtubeVideoId ? (
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
                      title={`${movie.title} YouTube Trailer`}
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

          {/* Streaming Section */}
          {movie.streamingUrl && (
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
                    Play Movie
                  </>
                )}
              </button>
              {showStreamingPlayer && (
                <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                  <ProxyVideoPlayer
                    src={movie.streamingUrl}
                    title={`${movie.title} Streaming Player`}
                    className="w-full h-full"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
