"use client";

import SupportFeedback from "@/components/SupportFeedback";
import { FaHome, FaPhone, FaEnvelope } from "react-icons/fa";
import { motion } from "framer-motion";

export default function ContactPage() {
  return (
    <main className="min-h-screen relative p-10 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20"></div>
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

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">
        {/* Left side: Contact info */}
        <motion.section
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:w-1/2 space-y-8 bg-gray-800/20 backdrop-blur-md rounded-xl p-8 border border-indigo-600/30 shadow-2xl"
        >
          <h1 className="text-5xl font-extrabold mb-6 text-center lg:text-left text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-text-flicker">
            Contact Us
          </h1>
          <p className="text-lg max-w-md leading-relaxed text-center lg:text-left text-gray-300">
            If you have any questions, suggestions, need a developer, or want to get in touch, please use the form provided.
          </p>
          <ul className="space-y-8 max-w-md mx-auto lg:mx-0">
            <motion.li
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center space-x-4 p-4 rounded-lg bg-gray-700/30 backdrop-blur-sm border border-indigo-600/20"
            >
              <FaHome className="w-8 h-8 text-cyan-400" aria-hidden="true" />
              <div>
                <p className="font-semibold text-cyan-400 text-lg">Address</p>
                <p className="text-gray-300">anonymous</p>
              </div>
            </motion.li>
            <motion.li
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center space-x-4 p-4 rounded-lg bg-gray-700/30 backdrop-blur-sm border border-indigo-600/20"
            >
              <FaPhone className="w-8 h-8 text-cyan-400" aria-hidden="true" />
              <div>
                <p className="font-semibold text-cyan-400 text-lg">Phone</p>
                <p className="text-gray-300">+254701912357</p>
              </div>
            </motion.li>
            <motion.li
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center space-x-4 p-4 rounded-lg bg-gray-700/30 backdrop-blur-sm border border-indigo-600/20"
            >
              <FaEnvelope className="w-8 h-8 text-cyan-400" aria-hidden="true" />
              <div>
                <p className="font-semibold text-cyan-400 text-lg">Email</p>
                <p className="text-gray-300">bravinlite@gmail.com</p>
              </div>
            </motion.li>
          </ul>
        </motion.section>

        {/* Right side: Send Message form */}
        <motion.section
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="lg:w-1/2 bg-gray-800/20 backdrop-blur-md rounded-xl p-8 border border-indigo-600/30 shadow-2xl"
        >
          <h2 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
            Send Message
          </h2>
          <SupportFeedback />
        </motion.section>
      </div>
    </main>
  );
}
