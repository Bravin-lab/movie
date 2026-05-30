"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type DownloadItem = {
  id: string;
  fileName: string;
  status: string;
  progress: number;
  speed: number;
  peers: number;
};

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchDownloads = async () => {
      try {
        const res = await fetch('/api/vps-downloads');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        if (mounted) setDownloads(json.downloads || []);
      } catch (err) {
        console.error('Failed to load downloads:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDownloads();
    const interval = setInterval(fetchDownloads, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <h1 className="text-3xl font-bold sm:text-4xl">Active Downloads</h1>

        {loading ? (
          <div className="text-gray-300">Loading...</div>
        ) : downloads.length === 0 ? (
          <div className="bg-white/5 p-6 rounded-lg">No active downloads.</div>
        ) : (
          downloads.map((d) => (
            <div key={d.id} className="flex flex-col gap-4 rounded-xl bg-white/5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
              <div>
                <div className="font-semibold text-lg">{d.fileName}</div>
                <div className="text-sm text-gray-300">Status: {d.status} — {Number(d.progress).toFixed(1)}%</div>
                <div className="text-sm text-gray-400 mt-1">Peers: {d.peers} • Speed: {formatSpeed(d.speed)}</div>
              </div>

              <div className="flex items-center gap-3">
                {d.status === 'completed' ? (
                  <a
                    className="px-4 py-2 bg-green-600 rounded-full hover:bg-green-700"
                    href={`/api/download/file/${d.id}`}
                  >
                    Download File
                  </a>
                ) : (
                  <button className="px-4 py-2 bg-blue-600 rounded-full text-sm">View</button>
                )}
                <Link href="/" className="text-sm text-gray-400 underline">Back</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

function formatSize(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSec: number) {
  return formatSize(bytesPerSec) + '/s';
}
