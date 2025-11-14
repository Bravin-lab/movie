"use client";

import React, { useEffect, useState } from "react";
import DownloadSection from "@/components/DownloadSection";

interface Props {
  params: Promise<{ tvid: string }>;
}

export default function TVIdPage({ params }: Props) {
  const { tvid } = React.use(params);
  const [imdbId, setImdbId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function fetchImdb() {
      try {
        const res = await fetch(`/api/tv/${tvid}/external-ids`);
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore) setImdbId(data?.imdb_id || null);
      } catch {
        if (!ignore) setImdbId(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    if (tvid) fetchImdb();
    return () => {
      ignore = true;
    };
  }, [tvid]);

  return (
    <main className="text-white min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <h1 className="text-3xl font-bold mb-6">TV Show</h1>

      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-semibold mb-4">Download</h2>
        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : imdbId ? (
          <DownloadSection imdbId={imdbId} />
        ) : (
          <p className="text-gray-400">No IMDb ID found for this TV show. Download not available.</p>
        )}
      </div>
    </main>
  );
}