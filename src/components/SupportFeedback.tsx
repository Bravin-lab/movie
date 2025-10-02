"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export default function SupportFeedback() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    try {
      const response = await fetch("/api/support-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, message }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send feedback");
      }

      setStatus("success");
      setEmail("");
      setMessage("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send feedback");
      }
      setStatus("error");
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 border-b border-indigo-600/30 pb-2">
        Support & Feedback
      </h2>
      {status === "success" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-center"
        >
          Thank you for your feedback!
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-center"
        >
          {error}
        </motion.div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <label htmlFor="email" className="block mb-2 font-semibold text-gray-300 text-lg">
            Email (optional)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-lg bg-gray-700/50 backdrop-blur-sm text-white border border-indigo-600/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 placeholder-gray-400"
            placeholder="Your email address"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <label htmlFor="message" className="block mb-2 font-semibold text-gray-300 text-lg">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
            className="w-full p-4 rounded-lg bg-gray-700/50 backdrop-blur-sm text-white border border-indigo-600/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 resize-none transition-all duration-300 placeholder-gray-400"
            placeholder="Describe your issue or suggestion"
          />
        </motion.div>
        <motion.button
          type="submit"
          disabled={status === "sending"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg border border-indigo-600/30"
        >
          {status === "sending" ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
          ) : (
            "Send Feedback"
          )}
        </motion.button>
      </form>
    </motion.section>
  );
}
