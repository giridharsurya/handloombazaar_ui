"use client";

import React, { useState } from "react";

type CategoriesFilterProps = {
  onFilterChange?: (filters: FilterState) => void;
};

export type FilterState = {
  priceRange: [number, number];
  selectedMaterials: string[];
};

export default function CategoriesFilter({ onFilterChange }: CategoriesFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 50000],
    selectedMaterials: [],
  });

  const materials = ["Silk", "Cotton", "Linen", "Wool", "Synthetic"];

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters: FilterState = {
      ...filters,
      priceRange: [Number(e.target.value), filters.priceRange[1]],
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleMaterialToggle = (material: string) => {
    const newMaterials = filters.selectedMaterials.includes(material)
      ? filters.selectedMaterials.filter((m) => m !== material)
      : [...filters.selectedMaterials, material];

    const newFilters = { ...filters, selectedMaterials: newMaterials };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleReset = () => {
    const newFilters: FilterState = {
      priceRange: [0, 50000],
      selectedMaterials: [],
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
            <label className="text-sm text-gray-600 dark:text-gray-400">Max: ₹{filters.priceRange[0].toLocaleString()}</label>
            <input
              type="range"
              min="0"
              max="50000"
              step="2500"
              value={filters.priceRange[0]}
              onChange={handlePriceChange}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Material Filter */}
      <div className="mb-8">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Material</h4>
        <div className="space-y-2">
          {materials.map((material) => (
            <label key={material} className="flex items-center cursor-pointer gap-2">
              <input
                type="checkbox"
                checked={filters.selectedMaterials.includes(material)}
                onChange={() => handleMaterialToggle(material)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{material}</span>
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
