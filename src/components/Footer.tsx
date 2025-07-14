"use client";

import Link from "next/link";
import { FaFacebook, FaInstagram, FaWhatsapp, FaGoogle, FaGithub, FaTelegram, FaPhone } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-6">
      <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand and Tagline */}
        <div>
          <h3 className="text-3xl font-extrabold mb-4 tracking-wide">
            <span className="text-red-600">BRA</span>
            <span className="text-white">VIN</span>
          </h3>
          <p className="text-sm font-light italic max-w-xs">
            Empowering Innovation. Driving Transformation.
          </p>
          <p className="flex items-center space-x-2 mt-6 text-sm font-medium">
            <FaPhone />
            <span>+254701912357</span>
          </p>
          <p className="mt-2 text-sm font-medium">
            Email: <a href="mailto:techsavvy@bravin.store" className="underline hover:text-red-600">techsavvy@bravin.store</a>
          </p>
        </div>

        {/* Our Services */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Our Services</h4>
          <ul className="space-y-2 text-sm font-light">
            <li>Web Design</li>
            <li>SEO Marketing</li>
            <li>App Development</li>
            <li>Brand Design</li>
            <li>Consulting</li>
            <li>cybersecurity</li>
          </ul>
        </div>

        {/* About Us */}
        <div>
          <h4 className="text-lg font-semibold mb-4">About Dev</h4>
          <ul className="space-y-2 text-sm font-light">
            <li>My Expertise</li>
            <li>My Philosophy</li>
            <li>My Values</li>
            <li>Blog</li>
            <li>Community</li>
            <li>dev.bravin.news</li>
          </ul>
        </div>

        {/* Our Offices */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Globally available </h4>
          <ul className="space-y-2 text-sm font-light">
            <li>Nairobi, Kenya</li>
            <li>Los Angeles, USA</li>
            <li>London, UK</li>
            <li>Berlin, Germany</li>
            <li>Paris, France</li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">FOLLOW</h4>
          <div className="flex space-x-4 mb-6 text-2xl">
            <a href="https://www.facebook.com/brave.light.963" aria-label="Facebook" className="hover:text-red-600"><FaFacebook /></a>
            <a href="https://www.instagram.com/top_thrille.r/" aria-label="Instagram" className="hover:text-red-600"><FaInstagram /></a>
            <a href="https://wa.me/+254701912357" aria-label="WhatsApp" className="hover:text-red-600"><FaWhatsapp /></a>
            <a href="#" aria-label="Google" className="hover:text-red-600"><FaGoogle /></a>
            <a href="https://github.com/Bravin-lab" aria-label="GitHub" className="hover:text-red-600"><FaGithub /></a>
            <a href="https://t.me/Bravi_n" aria-label="Telegram" className="hover:text-red-600"><FaTelegram /></a>
          </div>
          <Link href="/contact">
            <button className="bg-red-600 hover:bg-red-700 transition-colors text-white py-2 rounded-md font-semibold w-full">
              Contact
            </button>
          </Link>
        </div>
      </div>
      <div className="mt-12 border-t border-gray-700 pt-4 text-center text-xs font-light">
        copyright &copy; 2025 Techlords. created and maintained by <span className="text-red-600">Bravin.</span>
      </div>
    </footer>
  );
}
