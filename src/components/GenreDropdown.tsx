import React, { useState, useRef, useEffect } from "react";

interface Genre {
  id: number;
  name: string;
}

interface GenreDropdownProps {
  genres?: Genre[];
  selectedGenre: number | null;
  onChange: (genreId: number | null) => void;
}

const fixedGenres: Genre[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 14, name: "Fantasy" },
  { id: 27, name: "Horror" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction (Sci-Fi)" },
  { id: 53, name: "Thriller" },
  { id: 37, name: "Western" },
  { id: 16, name: "Animation" },
  { id: 99, name: "Documentary" },
  { id: 10402, name: "Musical" },
  { id: 1, name: "Biography / Biopic" },
];

export default function GenreDropdown({ genres = [], selectedGenre, onChange }: GenreDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleSelect(id: number | null) {
    onChange(id);
    setIsOpen(false);
  }

  const allGenres = [...fixedGenres];

  // Optionally merge with passed genres, avoiding duplicates by id
  genres.forEach((g) => {
    if (!allGenres.find((fg) => fg.id === g.id)) {
      allGenres.push(g);
    }
  });

  const selectedGenreName = selectedGenre ? allGenres.find(g => g.id === selectedGenre)?.name : "All Genres";

  return (
    <div className="relative inline-block w-full max-w-md" ref={dropdownRef}>
      <button
        type="button"
        className="w-full px-4 py-2 text-left rounded-md border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedGenreName || "All Genres"}
        <span className="float-right">&#9662;</span>
      </button>
      {isOpen && (
        <ul
          tabIndex={-1}
          role="listbox"
          aria-activedescendant={selectedGenre ? `genre-${selectedGenre}` : undefined}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          <li
            key="all-genres"
            id="genre-all"
            role="option"
            aria-selected={selectedGenre === null}
            className={`cursor-pointer select-none px-4 py-2 hover:bg-indigo-600 ${selectedGenre === null ? "bg-indigo-700" : ""}`}
            onClick={() => handleSelect(null)}
          >
            All Genres
          </li>
          {allGenres.map((genre) => (
            <li
              key={genre.id}
              id={`genre-${genre.id}`}
              role="option"
              aria-selected={selectedGenre === genre.id}
              className={`cursor-pointer select-none px-4 py-2 hover:bg-indigo-600 ${selectedGenre === genre.id ? "bg-indigo-700" : ""}`}
              onClick={() => handleSelect(genre.id)}
            >
              {genre.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
