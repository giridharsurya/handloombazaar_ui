"use client";

import React, { useState } from "react";

type SareesFilterProps = {
  categories: string[];
  onFilterChange?: (filters: FilterState) => void;
};

export type FilterState = {
  priceRange: [number, number];
  selectedCategories: string[];
};

export default function SareesFilter({ categories, onFilterChange }: SareesFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 25000],
    selectedCategories: [],
  });

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters: FilterState = {
    ...filters,
    priceRange: [Number(e.target.value), filters.priceRange[1]],
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters :FilterState = {
      ...filters,
      priceRange: [Number(e.target.value), filters.priceRange[1]],
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.selectedCategories.includes(category)
      ? filters.selectedCategories.filter((c) => c !== category)
      : [...filters.selectedCategories, category];

    const newFilters = { ...filters, selectedCategories: newCategories };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleReset = () => {
    const newFilters :FilterState = {
      priceRange: [0, 25000],
      selectedCategories: [],
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <aside className="w-full bg-gray-50 dark:bg-gray-900 rounded-lg p-6 h-fit">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Filters</h3>

      {/* Price Range Filter */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Price Range</h4>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Min: ₹{filters.priceRange[0].toLocaleString()}
            </label>
            <input
              type="range"
              min="0"
              max="25000"
              step="1000"
              value={filters.priceRange[0]}
              onChange={handleMinPriceChange}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Max: ₹{filters.priceRange[1].toLocaleString()}
            </label>
            <input
              type="range"
              min="0"
              max="25000"
              step="1000"
              value={filters.priceRange[1]}
              onChange={handleMaxPriceChange}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Category</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((category) => (
            <label key={category} className="flex items-center cursor-pointer gap-2">
              <input
                type="checkbox"
                checked={filters.selectedCategories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="w-full px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors text-sm font-medium"
      >
        Reset Filters
      </button>
    </aside>
  );
}
