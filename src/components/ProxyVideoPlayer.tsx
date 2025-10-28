"use client";

import React from 'react';

interface ProxyVideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export default function ProxyVideoPlayer({ src, title, className = "" }: ProxyVideoPlayerProps) {
  return (
    <iframe
      src={src}
      title={title}
      className={`w-full h-full border-0 ${className}`}
      allowFullScreen
      allow="autoplay; encrypted-media"
    />
  );
}
