"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

interface MovieBackdrop {
  id: number;
  backdrop_path: string;
  title: string;
}

const FloatingParticles = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const particles = Array.from({ length: 50 }, (_, i) => i);

  return (
    <>
      {particles.map((particle) => {
        // Use deterministic values based on particle index to avoid hydration mismatch
        const seed = particle * 0.1;
        const x = (Math.sin(seed) * 0.5 + 0.5) * (typeof window !== 'undefined' ? window.innerWidth : 1920);
        const y = (Math.cos(seed) * 0.5 + 0.5) * (typeof window !== 'undefined' ? window.innerHeight : 1080);
        const scale = (Math.sin(seed * 2) * 0.25 + 0.75);
        const opacity = (Math.cos(seed * 3) * 0.2 + 0.6);
        const duration = (Math.sin(seed * 4) * 5 + 10);

        return (
          <motion.div
            key={particle}
            className="absolute w-1 h-1 bg-white rounded-full"
            initial={{
              x,
              y,
              scale,
              opacity,
            }}
            animate={{
              x: (Math.sin(seed + 1) * 0.5 + 0.5) * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              y: (Math.cos(seed + 1) * 0.5 + 0.5) * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              scale,
              opacity,
            }}
            transition={{
              duration,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        );
      })}
    </>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const [backgroundImages, setBackgroundImages] = useState<MovieBackdrop[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [subtitleText, setSubtitleText] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);

  const fullText = "Made with ❤️ by Bravin";
  const welcomeText = "Welcome";

  useEffect(() => {
    // Fetch popular movies for background slideshow
    const fetchBackgroundImages = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        console.log('API Key available:', !!apiKey); // Debug log
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&page=1`
        );
        console.log('Response status:', response.status); // Debug log
        const data = await response.json();
        console.log('TMDB API Response:', data); // Debug log
        if (data.results) {
          const moviesWithBackdrops = data.results
            .filter((movie: MovieBackdrop) => movie.backdrop_path)
            .slice(0, 10); // Get first 10 movies with backdrops
          console.log('Movies with backdrops:', moviesWithBackdrops); // Debug log
          setBackgroundImages(moviesWithBackdrops);
        } else {
          console.error('No results in TMDB response');
        }
      } catch (error) {
        console.error("Failed to fetch background images:", error);
      }
    };

    fetchBackgroundImages();
  }, []);

  // Background slideshow effect
  useEffect(() => {
    if (backgroundImages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [backgroundImages]);

  // Show welcome text immediately
  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Typewriter effect for subtitle text
  useEffect(() => {
    let index = 0;
    const typeWriter = () => {
      if (index < fullText.length) {
        setSubtitleText(fullText.slice(0, index + 1));
        index++;
        setTimeout(typeWriter, 100); // Speed of typing
      }
    };

    const timer = setTimeout(typeWriter, 1500); // Start after welcome text shows
    return () => clearTimeout(timer);
  }, []);

  // Redirect after 8 seconds (longer to show the animation)
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/home");
    }, 8000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center text-white overflow-hidden relative">
      {/* Dynamic Background Slideshow */}
      {backgroundImages.length > 0 && (
        <div className="absolute inset-0">
          <Image
            src={`https://image.tmdb.org/t/p/original${backgroundImages[currentImageIndex].backdrop_path}`}
            alt={backgroundImages[currentImageIndex].title}
            fill
            className="object-cover transition-opacity duration-1000"
            priority
            onError={(e) => {
              console.error('Image failed to load:', backgroundImages[currentImageIndex].backdrop_path, e);
              // Try next image on error
              setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
            }}
            onLoad={() => console.log('Image loaded successfully:', backgroundImages[currentImageIndex].title)}
          />
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80"></div>
        </div>
      )}

      {/* Fallback gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>

      {/* Animated Background Effects */}
      <motion.div
        className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity }}
      ></motion.div>
      <motion.div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 5, repeat: Infinity }}
      ></motion.div>
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      ></motion.div>

      {/* Floating Particles */}
      <FloatingParticles />

      <div className="text-center relative z-10 px-4">
        {showWelcome && (
          <motion.h1
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-5xl md:text-7xl font-extrabold mb-6 text-white animate-text-flicker"
          >
            {welcomeText}
          </motion.h1>
        )}

        <motion.p
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="text-lg md:text-xl text-gray-300 mb-8 font-mono"
        >
          <span className="text-green-400">$ </span>
          {subtitleText}
          <span className="animate-pulse text-green-400">|</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="mt-8"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
        </motion.div>
      </div>
    </main>
  );
}
