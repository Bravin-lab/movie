"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ProxyVideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export default function ProxyVideoPlayer({ src, title, className = "" }: ProxyVideoPlayerProps) {
  const [useCustomPlayer, setUseCustomPlayer] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Extract video sources from the proxy URL
  const extractVideoSources = useCallback(async () => {
    if (!src.includes('/api/proxy-stream')) return;

    setIsLoading(true);
    try {
      const response = await fetch(src);
      if (response.ok) {
        const html = await response.text();
        // Look for video sources in the HTML
        const videoMatch = html.match(/<source[^>]+src="([^"]+)"/);
        if (videoMatch) {
          setVideoSrc(videoMatch[1]);
          setUseCustomPlayer(true);
        }
      }
    } catch (error) {
      console.error('Failed to extract video sources:', error);
    } finally {
      setIsLoading(false);
    }
  }, [src]);

  useEffect(() => {
    if (src && !useCustomPlayer) {
      extractVideoSources();
    }
  }, [src, useCustomPlayer, extractVideoSources]);

  // Add ad blocking parameters to the iframe src
  const adBlockedSrc = src + (src.includes('?') ? '&' : '?') + 'adb=1&adblock=1&noads=1';

  if (useCustomPlayer && videoSrc) {
    return (
      <div className={`relative w-full h-full bg-black ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
        <video
          ref={videoRef}
          src={videoSrc}
          controls
          autoPlay
          className="w-full h-full"
          title={title}
          onError={() => {
            // Fallback to iframe if video fails
            setUseCustomPlayer(false);
          }}
        >
          Your browser does not support the video tag.
        </video>
        <button
          onClick={() => setUseCustomPlayer(false)}
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm hover:bg-opacity-75"
        >
          Use Embedded
        </button>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <iframe
        src={adBlockedSrc}
        title={title}
        className="w-full h-full border-0"
        allowFullScreen
        allow="autoplay; encrypted-media"
        sandbox="allow-same-origin allow-scripts allow-presentation"
      />
      {videoSrc && (
        <button
          onClick={() => setUseCustomPlayer(true)}
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm hover:bg-opacity-75"
        >
          Use Custom Player
        </button>
      )}
    </div>
  );
}
