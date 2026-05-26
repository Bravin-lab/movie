"use client";

import React, { useMemo, useState } from 'react';
import { FaPlay, FaSpinner, FaVideo } from 'react-icons/fa';

type StreamSectionProps = {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  season?: number;
  episode?: number;
};

export default function StreamSection({ tmdbId, mediaType, title, season, episode }: StreamSectionProps) {
  const [showPlayer, setShowPlayer] = useState(false);

  const embedUrl = useMemo(() => {
    const params = new URLSearchParams({
      tmdb: String(tmdbId),
      type: mediaType,
    });

    if (typeof season === 'number') params.set('season', String(season));
    if (typeof episode === 'number') params.set('episode', String(episode));
    params.set('strict', 'true');

    return `/api/stream-proxy?${params.toString()}`;
  }, [episode, mediaType, season, tmdbId]);

  return (
    <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
      <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            <FaVideo className="text-cyan-300" />
            Stream
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-300 bg-clip-text text-transparent">
            Watch in Browser
          </h2>
          <p className="max-w-2xl text-sm text-gray-400 leading-6">
            Ad-filtered player for {mediaType === 'movie' ? 'movies' : 'TV shows'} with the same card styling as the rest of the app.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
          Ready to play
        </div>
      </div>

      {!showPlayer ? (
        <button
          onClick={() => setShowPlayer(true)}
          className="group w-full rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 px-8 py-4 font-semibold shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:from-cyan-500 hover:via-sky-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          <span className="flex items-center justify-center gap-3 text-white">
            <FaPlay className="transition-transform duration-300 group-hover:scale-110" />
            Play {title}
          </span>
        </button>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/80 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-gray-400">
                  {mediaType === 'movie' ? 'Movie stream' : 'TV stream'} via proxy player
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-gray-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Live
              </div>
            </div>

            <div className="aspect-video bg-black">
              <iframe
                src={embedUrl}
                title={`${title} Stream Player`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPlayer(false)}
              className="rounded-full border border-white/10 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5"
            >
              Hide Player
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FaSpinner className="animate-spin" />
              If loading feels slow, the proxy is fetching and filtering the upstream embed.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}