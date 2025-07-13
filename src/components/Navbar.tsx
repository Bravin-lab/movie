"use client";

import Link from "next/link";
import { useState } from "react";
import { FiMenu, FiX, FiLogIn, FiUserPlus, FiHome } from "react-icons/fi";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-gray-900 text-white p-4 relative">
      <div className="flex justify-between items-center">
        <div className="text-xl font-bold flex-shrink-0 flex items-center space-x-2">
          <FiHome size={24} />
          <Link href="/">HOME</Link>
        </div>
        <button
          onClick={toggleMenu}
          className="p-2 rounded hover:bg-gray-700 transition"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 shadow-lg rounded-md z-50">
          <div className="flex flex-col space-y-2 p-4">
            <Link
              href="/trending"
              className="px-3 py-1 rounded hover:bg-indigo-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Trending
            </Link>
            <Link
              href="/popular"
              className="px-3 py-1 rounded hover:bg-indigo-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Popular
            </Link>
            <Link
              href="/upcoming"
              className="px-3 py-1 rounded hover:bg-indigo-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Upcoming
            </Link>
            <Link
              href="/tv/trending"
              className="px-3 py-1 rounded hover:bg-indigo-600 transition"
              onClick={() => setIsOpen(false)}
            >
              TV Shows
            </Link>
            <Link
              href="/login"
              className="flex items-center px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 transition"
              onClick={() => setIsOpen(false)}
            >
              <FiLogIn className="mr-2" />
              Sign In
            </Link>
            <Link
              href="/signup"
              className="flex items-center px-3 py-1 rounded border border-indigo-600 hover:bg-indigo-600 hover:text-white transition"
              onClick={() => setIsOpen(false)}
            >
              <FiUserPlus className="mr-2" />
              Sign Up
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-1 rounded hover:bg-indigo-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/contact"
              className="px-3 py-1 rounded hover:bg-indigo-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
