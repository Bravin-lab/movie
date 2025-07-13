"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FilterSortContextType {
  filterGenre: string;
  filterYear: string;
  filterRating: number | null;
  sortOption: string;
  setFilterGenre: (genre: string) => void;
  setFilterYear: (year: string) => void;
  setFilterRating: (rating: number | null) => void;
  setSortOption: (option: string) => void;
}

const FilterSortContext = createContext<FilterSortContextType | undefined>(undefined);

export const FilterSortProvider = ({ children }: { children: ReactNode }) => {
  const [filterGenre, setFilterGenre] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<string>('');

  return (
    <FilterSortContext.Provider
      value={{
        filterGenre,
        filterYear,
        filterRating,
        sortOption,
        setFilterGenre,
        setFilterYear,
        setFilterRating,
        setSortOption,
      }}
    >
      {children}
    </FilterSortContext.Provider>
  );
};

export const useFilterSort = (): FilterSortContextType => {
  const context = useContext(FilterSortContext);
  if (!context) {
    throw new Error('useFilterSort must be used within a FilterSortProvider');
  }
  return context;
};
