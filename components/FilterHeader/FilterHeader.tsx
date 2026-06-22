"use client";

import React, { useState } from "react";

type SortOption = "relevance" | "price-low" | "price-high" | "newest";

type FilterHeaderProps = {
  pageTitle: string;
  productCount: number;
  showFiltersToggle?: boolean;
  onToggleFilters?: () => void;
  filtersOpen?: boolean;
  onSortChange?: (sort: SortOption) => void;
  isSticky?: boolean;
};

export default function FilterHeader({
  pageTitle,
  productCount,
  showFiltersToggle = true,
  onToggleFilters,
  filtersOpen = true,
  onSortChange,
  isSticky = true,
}: FilterHeaderProps) {
  const [sortBy, setSortBy] = useState<SortOption>("relevance");

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value as SortOption;
    setSortBy(newSort);
    onSortChange?.(newSort);
  };

  return (
    <div
      className={`${
        isSticky ? "sticky top-[7.5rem] z-40" : "relative"
      } w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800`}
    >
      <div className="w-full px-4 py-4">
        <div className="w-full mx-auto flex items-center justify-between">
          {/* Left: Filter Toggle */}
          {showFiltersToggle && (
            <button
              onClick={onToggleFilters}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Filter by
              </span>
              <span
                className={`text-lg transition-transform ${
                  filtersOpen ? "rotate-0" : "rotate-180"
                }`}
              >
                ▼
              </span>
            </button>
          )}

          {/* Center: Title and Count */}
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {pageTitle}
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Showing {productCount} products
            </p>
          </div>

          {/* Right: Sort By */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="relevance">Relevance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
