"use client";

import SupportFeedback from "@/components/SupportFeedback";
import { FaHome, FaPhone, FaEnvelope } from "react-icons/fa";

export default function ContactPage() {
  return (
    <main
      className="min-h-screen relative p-8 bg-center bg-no-repeat bg-cover bg-transparent"
      style={{ backgroundImage: "url('/25.png')" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-transparent bg-opacity-80 z-0"></div>

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row gap-12 text-red-900">
        {/* Left side: Contact info */}
        <section className="md:w-1/2 space-y-8 bg-transparent bg-opacity-30 backdrop-blur-sm rounded-lg p-6">
          <h1 className="text-4xl font-bold mb-4 text-center md:text-left">Contact Us</h1>
          <p className="text-sm max-w-md leading-relaxed text-center md:text-left">
           If you have any questions, suggestions, need a developer, or want to get in touch, please use the form provided.
          </p>
          <ul className="space-y-6 max-w-md mx-auto md:mx-0">
            <li className="flex items-center space-x-4">
              <FaHome className="w-6 h-6 text-white" aria-hidden="true" />
              <div>
                <p className="font-semibold text-cyan-400">Address</p>
                <p>anonymous</p>
              </div>
            </li>
            <li className="flex items-center space-x-4">
              <FaPhone className="w-6 h-6 text-white" aria-hidden="true" />
              <div>
                <p className="font-semibold text-cyan-400">Phone</p>
                <p>+254701912357</p>
              </div>
            </li>
            <li className="flex items-center space-x-4">
              <FaEnvelope className="w-6 h-6 text-white" aria-hidden="true" />
              <div>
                <p className="font-semibold text-cyan-400">Email</p>
                <p>bravinlite@gmail.com</p>
              </div>
            </li>
          </ul>
        </section>

        {/* Right side: Send Message form */}
        <section className="md:w-1/2 bg-transparent rounded-lg p-8 shadow-lg text-red-900 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">Send Message</h2>
          <SupportFeedback />
        </section>
      </div>
    </main>
  );
}
