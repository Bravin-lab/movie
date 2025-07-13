"use client";

import SupportFeedback from "@/components/SupportFeedback";

export default function ContactPage() {
  return (
    <main
      className="min-h-screen relative flex flex-col items-center justify-center p-8 bg-center bg-no-repeat bg-cover animate-fadeIn"
      style={{ backgroundImage: "url('/7.jpg')" }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80 z-0"></div>

      <div className="relative z-10 bg-black bg-opacity-30 rounded-xl p-12 max-w-3xl w-full text-white shadow-2xl backdrop-blur-lg">
        <h1 className="text-5xl font-extrabold mb-6 text-center leading-tight">Contact Me</h1>
        <p className="mb-10 text-lg text-center max-w-xl mx-auto leading-relaxed">
          If you have any questions, suggestions, need a developer, or want to get in touch, please use the form below.
        </p>
        <div className="flex justify-center">
          <SupportFeedback />
        </div>
      </div>
    </main>
  );
}
