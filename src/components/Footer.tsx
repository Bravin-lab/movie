"use client";

import Link from "next/link";
import { FaFacebook, FaInstagram, FaWhatsapp, FaGoogle, FaGithub, FaTelegram, FaPhone } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-16 px-6 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="relative container mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-8">
        {/* Brand and Tagline */}
        <div className="md:col-span-2">
          <h3 className="text-4xl font-extrabold mb-6 tracking-wide bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
            <span className="text-red-400">BRA</span>
            <span className="text-white">VIN</span>
          </h3>
          <p className="text-sm font-light italic max-w-xs mb-6 text-gray-300">
            Empowering Innovation. Driving Transformation.
          </p>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm font-medium">
              <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                <FaPhone className="text-purple-400" />
              </div>
              <span>+254701912357</span>
            </div>
            <p className="text-sm font-medium">
              Email: <a href="mailto:techsavvy@bravin.store" className="underline hover:text-purple-400 transition-colors">techsavvy@bravin.store</a>
            </p>
          </div>
        </div>

        {/* Our Services */}
        <div>
          <h4 className="text-lg font-semibold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Our Services</h4>
          <ul className="space-y-3 text-sm font-light">
            <li className="hover:text-purple-400 transition-colors cursor-pointer">Web Design</li>
            <li className="hover:text-purple-400 transition-colors cursor-pointer">SEO Marketing</li>
            <li className="hover:text-purple-400 transition-colors cursor-pointer">App Development</li>
            <li className="hover:text-purple-400 transition-colors cursor-pointer">Brand Design</li>
            <li className="hover:text-purple-400 transition-colors cursor-pointer">Consulting</li>
            <li className="hover:text-purple-400 transition-colors cursor-pointer">Cybersecurity</li>
          </ul>
        </div>

        {/* About Us */}
        <div>
          <h4 className="text-lg font-semibold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">About Dev</h4>
          <ul className="space-y-3 text-sm font-light">
            <li className="hover:text-purple-400 transition-colors cursor-pointer">My Expertise</li>
            <li className="hover:text-purple-400 transition-colors cursor-pointer">My Philosophy</li>
            <li className="hover:text-purple-400 transition-colors cursor-pointer">My Values</li>
            <li className="hover:text-purple-400 transition-colors cursor-pointer">Blog</li>
            <li className="hover:text-purple-400 transition-colors cursor-pointer">Community</li>
            <li className="hover:text-purple-400 transition-colors cursor-pointer">dev.bravin.news</li>
          </ul>
        </div>

        {/* Our Offices */}
        <div>
          <h4 className="text-lg font-semibold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Globally available</h4>
          <ul className="space-y-3 text-sm font-light">
            <li className="hover:text-purple-400 transition-colors cursor-pointer">Nairobi, Kenya</li>
            <li className="hover:text-purple-400 transition-colors cursor-pointer">Los Angeles, USA</li>
            <li className="hover:text-purple-400 transition-colors cursor-pointer">London, UK</li>
            <li className="hover:text-purple-400 transition-colors cursor-pointer">Berlin, Germany</li>
            <li className="hover:text-purple-400 transition-colors cursor-pointer">Paris, France</li>
          </ul>
        </div>

        {/* Follow & Contact */}
        <div>
          <h4 className="text-lg font-semibold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">FOLLOW</h4>
          <div className="flex space-x-4 mb-8">
            <a href="https://www.facebook.com/brave.light.963" aria-label="Facebook" className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110">
              <FaFacebook className="text-purple-400" />
            </a>
            <a href="https://www.instagram.com/top_thrille.r/" aria-label="Instagram" className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110">
              <FaInstagram className="text-purple-400" />
            </a>
            <a href="https://wa.me/+254701912357" aria-label="WhatsApp" className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110">
              <FaWhatsapp className="text-purple-400" />
            </a>
            <a href="#" aria-label="Google" className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110">
              <FaGoogle className="text-purple-400" />
            </a>
            <a href="https://github.com/Bravin-lab" aria-label="GitHub" className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110">
              <FaGithub className="text-purple-400" />
            </a>
            <a href="https://t.me/Bravi_n" aria-label="Telegram" className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110">
              <FaTelegram className="text-purple-400" />
            </a>
          </div>
          <Link href="/contact">
            <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 text-white py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105">
              Contact
            </button>
          </Link>
        </div>
      </div>

      {/* Global Offices - Horizontal Scroll */}
      <div className="relative mt-12">
        <h4 className="text-lg font-semibold mb-6 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Globally Available
        </h4>
        <div className="flex overflow-x-auto space-x-6 pb-4 px-4">
          {[
            { city: "Nairobi, Kenya", flag: "🇰🇪" },
            { city: "Los Angeles, USA", flag: "🇺🇸" },
            { city: "London, UK", flag: "🇬🇧" },
            { city: "Berlin, Germany", flag: "🇩🇪" },
            { city: "Paris, France", flag: "🇫🇷" }
          ].map((office, index) => (
            <div key={index} className="flex-shrink-0 bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-lg hover:bg-white/10 transition-all duration-300 min-w-[200px] text-center">
              <div className="text-3xl mb-2">{office.flag}</div>
              <p className="text-sm font-medium text-gray-300">{office.city}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-16 border-t border-white/10 pt-8 text-center">
        <p className="text-xs font-light text-gray-400">
          Copyright &copy; 2026 Techlords. Created and maintained by{" "}
          <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent font-semibold">
            Bravin.
          </span>
        </p>
      </div>
    </footer>
  );
}
