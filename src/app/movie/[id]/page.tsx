"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMovieDetails } from "@/lib/tmdb";
import { searchYouTubeTrailer } from "@/lib/youtube";

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  genres: { id: number; name: string }[];
  credits: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
  };
  videos: {
    results: { id: string; key: string; name: string; site: string; type: string }[];
  };
  poster_path: string | null;
  streamingUrl?: string;
}

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default function MovieDetailsPage({ params }: Props) {
  const unwrappedParams = React.use(params);
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showYouTubePlayer, setShowYouTubePlayer] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [showStreamingPlayer, setShowStreamingPlayer] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchDetails() {
      try {
        const data = await getMovieDetails(Number(unwrappedParams.id));
        // Add streaming URL using vidsrc.xyz with tmdb id
        const streamingUrl = `https://vidsrc.xyz/embed/movie?tmdb=${data.id}`;
        setMovie({ ...data, streamingUrl });
      } catch (error) {
        console.error("Failed to fetch movie details", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [unwrappedParams.id]);

  useEffect(() => {
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
    return <div className="p-8 text-center text-gray-400">Loading movie details...</div>;
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

  return (
    <main className="p-10 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen max-w-screen-xl mx-auto rounded-lg shadow-xl">
      <button
        onClick={() => router.back()}
        className="mb-8 px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition font-semibold"
      >
        &larr; Back
      </button>

      <div className="flex flex-col lg:flex-row gap-12">
        {movie.poster_path ? (
          <img
            src={posterBaseUrl + movie.poster_path}
            alt={movie.title}
            className="rounded-lg shadow-2xl w-full lg:w-1/3"
          />
        ) : (
          <div className="bg-gray-700 h-72 rounded-lg flex items-center justify-center text-gray-400 w-full lg:w-1/3">
            No Image
          </div>
        )}

        <div className="flex-1 max-w-full overflow-x-auto">
          <h1 className="text-6xl font-extrabold mb-8 tracking-tight">{movie.title}</h1>
          <p className="text-indigo-400 mb-5 text-lg">Release Date: {movie.release_date || "N/A"}</p>
          <p className="mb-8 text-xl leading-relaxed">{movie.overview}</p>

          <h2 className="text-4xl font-bold mb-6">Genres</h2>
          <ul className="flex flex-wrap gap-4 mb-12">
            {movie.genres.map((genre) => (
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
            {movie.credits.cast.slice(0, 10).map((cast) => (
              <div key={cast.id} className="min-w-[120px] text-center">
                {cast.profile_path ? (
                  <img
                    src={posterBaseUrl + cast.profile_path}
                    alt={cast.name}
                    className="rounded-lg mx-auto mb-3 shadow-lg"
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

          <div className="mb-4 text-sm text-gray-400">
            <p>DEBUG: YouTube API Key: {process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ? "SET" : "NOT SET"}</p>
            <p>DEBUG: YouTube Video ID: {youtubeVideoId || "None"}</p>
            <p>DEBUG: Streaming URL: {movie.streamingUrl || "None"}</p>
          </div>

          {trailer ? (
            <div>
              <h2 className="text-4xl font-bold mb-6">Trailer</h2>
              <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-2xl mb-4">
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  title={trailer.name}
                  allowFullScreen
                  className="w-full h-72 md:h-96"
                />
              </div>
            </div>
          ) : youtubeVideoId ? (
            <div>
              <h2 className="text-4xl font-bold mb-6">Trailer</h2>
              <button
                onClick={toggleYouTubePlayer}
                className="mb-4 px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                {showYouTubePlayer ? "Hide YouTube Trailer" : "Play YouTube Trailer"}
              </button>
              {showYouTubePlayer && (
                <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-2xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                    title={`${movie.title} YouTube Trailer`}
                    allowFullScreen
                    className="w-full h-72 md:h-96"
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-lg">No trailer available.</p>
          )}

          {movie.streamingUrl && (
            <div>
              <h2 className="text-4xl font-bold mb-6">Watch Now</h2>
              <button
                onClick={toggleStreamingPlayer}
                className="mb-4 px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition font-semibold"
              >
                {showStreamingPlayer ? "Hide Streaming Player" : "Play Movie"}
              </button>
              {showStreamingPlayer && (
                <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-2xl">
                  <iframe
                    src={movie.streamingUrl}
                    allowFullScreen
                    className="w-full h-72 md:h-96"
                    title={`${movie.title} Streaming Player`}
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
