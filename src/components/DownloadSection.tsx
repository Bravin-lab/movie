"use client";

import React, { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import { FaCheck, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

export type DownloadSectionProps = {
  imdbId: string;
  title?: string;
  year?: number;
}

interface YTSMovie {
  id: number;
  url: string;
  imdb_code: string;
  title: string;
  title_english: string;
  title_long: string;
  slug: string;
  year: number;
  rating: number;
  runtime: number;
  genres: string[];
  summary: string;
  description_full: string;
  synopsis: string;
  yt_trailer_code: string;
  language: string;
  mpa_rating: string;
  background_image: string;
  background_image_original: string;
  small_cover_image: string;
  medium_cover_image: string;
  large_cover_image: string;
  state: string;
  torrents: YTSTorrent[];
  date_uploaded: string;
  date_uploaded_unix: number;
}

interface YTSTorrent {
  url: string;
  hash: string;
  quality: string;
  type: string;
  seeds: number;
  peers: number;
  size: string;
  size_bytes: number;
  date_uploaded: string;
  date_uploaded_unix: number;
}

interface DownloadStatus {
  id: string;
  fileName: string;
  status: 'downloading' | 'completed' | 'error';
  progress: number;
  speed: number;
  peers: number;
  size: number;
  downloaded: number;
  timeRemaining: number;
  error?: string;
}

const MAX_ALLOWED_TORRENT_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

const isAllowedTorrentSize = (sizeBytes: number) => {
  return Number.isFinite(sizeBytes) && sizeBytes <= MAX_ALLOWED_TORRENT_SIZE_BYTES;
};

export default function DownloadSection(props: DownloadSectionProps) {
  const { imdbId, title, year } = props;
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus | null>(null);
  const [isStartingDownload, setIsStartingDownload] = useState(false);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [ytsMovies, setYtsMovies] = useState<YTSMovie[]>([]);
  const [loadingYTS, setLoadingYTS] = useState(false);
  const [torrentError, setTorrentError] = useState<string | null>(null);

  const buildMagnetUri = (torrent: YTSTorrent, movieTitle: string) => {
    const params = new URLSearchParams();
    params.set('xt', `urn:btih:${torrent.hash}`);
    params.set('dn', movieTitle);

    const trackers = [
      'udp://tracker.opentrackr.org:1337/announce',
      'udp://open.stealth.si:80/announce',
      'udp://tracker.torrent.eu.org:451/announce',
      'udp://exodus.desync.com:6969/announce',
    ];

    trackers.forEach((tracker) => params.append('tr', tracker));

    return `magnet:?${params.toString()}`;
  };

  const getAvailableTorrents = (movie: YTSMovie) => {
    const torrentsByQuality = new Map<string, YTSTorrent>();

    for (const torrent of movie.torrents) {
      const current = torrentsByQuality.get(torrent.quality);

      if (!current || torrent.seeds > current.seeds) {
        torrentsByQuality.set(torrent.quality, torrent);
      }
    }

    return Array.from(torrentsByQuality.values()).sort((left, right) => right.seeds - left.seeds);
  };

  const getAllowedTorrents = (movie: YTSMovie) => {
    return getAvailableTorrents(movie).filter((torrent) => isAllowedTorrentSize(torrent.size_bytes));
  };

  const getDefaultQuality = (movie: YTSMovie) => {
    const allowedTorrents = getAllowedTorrents(movie);
    const preferredTorrent = allowedTorrents.find((torrent) => torrent.quality === '720p');

    return preferredTorrent?.quality || allowedTorrents[0]?.quality || '720p';
  };



  useEffect(() => {
    const fetchYTSMovies = async () => {
      if (!imdbId) return;
      setLoadingYTS(true);
      setTorrentError(null);
      try {
        const searchParams = new URLSearchParams({ imdbId });
        if (title) searchParams.set('title', title);
        if (typeof year === 'number' && !Number.isNaN(year)) {
          searchParams.set('year', String(year));
        }

        const response = await fetch(`/api/yts/torrents?${searchParams.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to fetch torrent information');
        }

        setYtsMovies(data.movies || []);
      } catch (error) {
        console.error('Failed to fetch YTS movies:', error);
        setTorrentError(error instanceof Error ? error.message : 'Failed to fetch torrent information');
        setYtsMovies([]);
      } finally {
        setLoadingYTS(false);
      }
    };
    fetchYTSMovies();
  }, [imdbId, title, year]);

  useEffect(() => {
    if (ytsMovies.length === 0) return;

    setSelectedQuality(getDefaultQuality(ytsMovies[0]));
  }, [ytsMovies]);

  const startDownload = async () => {
    if (!imdbId || ytsMovies.length === 0) return;

    setIsStartingDownload(true);
    try {
      const movie = ytsMovies[0]; // Assuming first movie is the best match
      const torrent = getAvailableTorrents(movie).find(t => t.quality === selectedQuality);

      if (!torrent) {
        throw new Error(`No ${selectedQuality} torrent available`);
      }

      if (!isAllowedTorrentSize(torrent.size_bytes)) {
        const message = 'Only torrents 2GB and below are allowed by the developer due to Telegram upload limits.';
        setTorrentError(message);
        throw new Error(message);
      }

      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          magnetUri: buildMagnetUri(torrent, movie.title),
          title: movie.title,
          quality: selectedQuality,
          sizeBytes: torrent.size_bytes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start download');
      }

      const result = await response.json();
      setDownloadId(result.downloadId);

      // Start polling for status
      startPolling(result.downloadId);

    } catch (error) {
      console.error('Download start error:', error);
      alert(`Failed to start download: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsStartingDownload(false);
    }
  };

  const startPolling = (id: string) => {
    // Clear existing interval
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    // Poll every 2 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/download?downloadId=${id}`);
        if (response.ok) {
          const status = await response.json();
          setDownloadStatus(status);

          // Stop polling if completed or error
          if (status.status === 'completed' || status.status === 'error') {
            clearInterval(interval);
            setPollInterval(null);
          }
        } else if (response.status === 404) {
          // Download not found, stop polling
          clearInterval(interval);
          setPollInterval(null);
          setDownloadStatus(null);
          setDownloadId(null);
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 2000);

    setPollInterval(interval);
  };

  const downloadFile = () => {
    if (!downloadId) return;
    // Use Next.js API proxy instead of direct VPS access and pass a readable filename
    const filename = downloadStatus?.fileName || `${title || 'movie'}.mp4`;
    const safeName = encodeURIComponent(filename);
    window.open(`/api/download/file/${downloadId}?name=${safeName}`, '_blank');
    
    // Or trigger download programmatically:
    // const link = document.createElement('a');
    // link.href = `/api/download/file/${downloadId}`;
    // link.download = downloadStatus?.fileName || 'movie.mp4';
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return formatSize(bytesPerSecond) + '/s';
  };

  const formatTime = (milliseconds: number) => {
    if (!milliseconds || milliseconds === Infinity) return 'Unknown';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
      <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Download movie
      </h2>

      {!downloadStatus && !downloadId && (
        <div className="space-y-6">
          {loadingYTS ? (
            <div className="text-center text-gray-400">
              <FaSpinner className="animate-spin inline mr-2" />
              Loading available torrents...
            </div>
          ) : torrentError ? (
            <div className="text-center text-red-300">
              {torrentError}
            </div>
          ) : ytsMovies.length > 0 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Quality
                </label>
                <select
                  value={selectedQuality}
                  onChange={(e) => {
                    setSelectedQuality(e.target.value);
                    setTorrentError(null);
                  }}
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  {getAllowedTorrents(ytsMovies[0]).map((torrent) => (
                    <option key={`${torrent.quality}-${torrent.hash}`} value={torrent.quality}>
                      {torrent.quality} ({torrent.size}) - Seeds: {torrent.seeds}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-amber-300">
                  2GB and below only. Larger files are disabled.
                </p>
              </div>

              <button
                type="button"
                onClick={startDownload}
                disabled={isStartingDownload}
                aria-label={isStartingDownload ? 'Starting download' : `Start download in ${selectedQuality}`}
                title={isStartingDownload ? 'Starting download' : `Start download in ${selectedQuality}`}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl shadow-emerald-500/30 transition-all duration-300 hover:scale-105 hover:from-emerald-400 hover:to-green-500 focus:outline-none focus:ring-2 focus:ring-emerald-300/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStartingDownload ? (
                  <FaSpinner className="animate-spin text-xl" aria-hidden="true" />
                ) : (
                  <FiDownload className="text-2xl" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {isStartingDownload ? 'Starting download' : `Start download in ${selectedQuality}`}
                </span>
              </button>
            </>
          ) : (
            <div className="text-center text-gray-400">
              movie coming soon.
            </div>
          )}
        </div>
      )}

      {downloadStatus && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {downloadStatus.fileName}
              </h3>
              <div className="flex items-center gap-2">
                {downloadStatus.status === 'downloading' && (
                  <FaSpinner className="animate-spin text-blue-400" />
                )}
                {downloadStatus.status === 'completed' && (
                  <FaCheck className="text-green-400" />
                )}
                {downloadStatus.status === 'error' && (
                  <FaExclamationTriangle className="text-red-400" />
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  downloadStatus.status === 'completed'
                    ? 'bg-green-500/20 text-green-400'
                    : downloadStatus.status === 'error'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {downloadStatus.status}
                </span>
              </div>
            </div>

            {downloadStatus.status === 'downloading' && (
              <div className="space-y-3">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${downloadStatus.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>
                    {(Number(downloadStatus.progress) || 0).toFixed(1)}%
                  </span>
                  <span>{formatSpeed(downloadStatus.speed)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Downloaded</p>
                    <p className="text-white">
                      {formatSize(downloadStatus.downloaded || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Size</p>
                    <p className="text-white">
                      {formatSize(downloadStatus.size || 0)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Peers:</span> {downloadStatus.peers}
                  </div>
                  <div>
                    <span className="text-gray-400">Size:</span> {formatSize(downloadStatus.size)}
                  </div>
                  <div>
                    <span className="text-gray-400">Downloaded:</span> {formatSize(downloadStatus.downloaded)}
                  </div>
                  <div>
                    <span className="text-gray-400">ETA:</span> {formatTime(downloadStatus.timeRemaining)}
                  </div>
                </div>
              </div>
            )}

            {downloadStatus.status === 'error' && (
              <div className="text-red-400 text-sm">
                Error: {downloadStatus.error}
              </div>
            )}
          </div>

          {downloadStatus.status === 'completed' && (
            <button
              onClick={downloadFile}
              type="button"
              aria-label="Download finished file"
              title="Download finished file"
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl shadow-emerald-500/30 transition-all duration-300 hover:scale-105 hover:from-emerald-400 hover:to-green-500 focus:outline-none focus:ring-2 focus:ring-emerald-300/80"
            >
              <FiDownload className="text-2xl" aria-hidden="true" />
            </button>
          )}

          <button
            onClick={() => {
              setDownloadStatus(null);
              setDownloadId(null);
              if (pollInterval) {
                clearInterval(pollInterval);
                setPollInterval(null);
              }
            }}
            className="w-full px-6 py-3 bg-gray-700 rounded-full hover:bg-gray-600 transition-all duration-300 font-semibold text-sm"
          >
            Start New Download
          </button>
        </div>
      )}
    </div>
  );
}
