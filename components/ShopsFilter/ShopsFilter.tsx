"use client";

import React, { useState } from "react";

type ShopsFilterProps = {
  onFilterChange?: (filters: FilterState) => void;
};

export type FilterState = {
  priceRange: [number, number];
  selectedTypes: string[];
};

export default function ShopsFilter({ onFilterChange }: ShopsFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 100000],
    selectedTypes: [],
  });

  const shopTypes = ["Traditional", "Designer", "Luxury", "Casual", "Festive"];

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters: FilterState = {
      ...filters,
      priceRange: [Number(e.target.value), filters.priceRange[1]],
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleTypeToggle = (type: string) => {
    const newTypes = filters.selectedTypes.includes(type)
      ? filters.selectedTypes.filter((t) => t !== type)
      : [...filters.selectedTypes, type];

    const newFilters = { ...filters, selectedTypes: newTypes };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleReset = () => {
    const newFilters :FilterState = {
      priceRange: [0, 100000],
      selectedTypes: [],
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <aside className="w-64 mt-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-6 h-fit sticky top-24">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Filters</h3>

      {/* Price Range Filter */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Price Range</h4>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Min: ₹{filters.priceRange[0].toLocaleString()}</label>
            <input
              type="range"
              min="0"
              max="100000"
              step="5000"
              value={filters.priceRange[0]}
              onChange={handlePriceChange}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Shop Type Filter */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Shop Type</h4>
        <div className="space-y-2">
          {shopTypes.map((type) => (
            <label key={type} className="flex items-center cursor-pointer gap-2">
              <input
                type="checkbox"
                checked={filters.selectedTypes.includes(type)}
                onChange={() => handleTypeToggle(type)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
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
