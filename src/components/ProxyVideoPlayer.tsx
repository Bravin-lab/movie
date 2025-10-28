"use client";

import React from 'react';

interface ProxyVideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export default function ProxyVideoPlayer({ src, title, className = "" }: ProxyVideoPlayerProps) {
  // Add ad blocking parameters to the iframe src
  const adBlockedSrc = src + (src.includes('?') ? '&' : '?') + 'adb=1&adblock=1&noads=1';

  return (
    <iframe
      src={adBlockedSrc}
      title={title}
      className={`w-full h-full border-0 ${className}`}
      allowFullScreen
      allow="autoplay; encrypted-media"
      sandbox="allow-same-origin allow-scripts allow-presentation"
    />
  );
}
