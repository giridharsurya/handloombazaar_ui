"use client";

import React, { useState } from "react";
import { ProductFilterAttribute } from "@/types/apiTypes";

type SareesFilterProps = {
  attributes: ProductFilterAttribute[];
  onFilterChange?: (filters: FilterState) => void;
};

export type FilterState = {
  priceRange: [number, number];
  selectedAttributeOptionIds: Record<number, number[]>;
};

export default function SareesFilter({ attributes, onFilterChange }: SareesFilterProps) {
  const DEBUG_FILTERS = true;
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 25000],
    selectedAttributeOptionIds: {},
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
  });

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters: FilterState = {
      ...filters,
      priceRange: [Number(e.target.value), filters.priceRange[1]],
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters: FilterState = {
      ...filters,
      priceRange: [filters.priceRange[0], Number(e.target.value)],
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAttributeOptionToggle = (attributeId: number, optionId: number) => {
    const current = filters.selectedAttributeOptionIds[attributeId] || [];
    const updated = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];

    const newFilters: FilterState = {
      ...filters,
      selectedAttributeOptionIds: {
        ...filters.selectedAttributeOptionIds,
        [attributeId]: updated,
      },
    };
    if (DEBUG_FILTERS) {
      console.log("[SareesFilter][Toggle] Attribute option changed", {
        attributeId,
        optionId,
        updatedSelectionForAttribute: updated,
        nextFilters: newFilters,
      });
    }
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleReset = () => {
    const newFilters: FilterState = {
      priceRange: [0, 25000],
      selectedAttributeOptionIds: {},
    };
    if (DEBUG_FILTERS) {
      console.log("[SareesFilter][Reset] Filters reset", newFilters);
    }
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <aside className="w-full bg-gray-50 dark:bg-gray-900 rounded-lg p-6 h-fit">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Filters</h3>

      {/* Price Range Filter */}
      <div className="mb-8 border-t border-gray-200 pt-4 dark:border-gray-700">
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="mb-3 flex w-full items-center justify-between text-left"
        >
          <h4 className="font-semibold text-gray-900 dark:text-white">Price Range</h4>
          <span className={`text-xs text-gray-600 dark:text-gray-400 transition-transform ${expandedSections.price ? "rotate-180" : "rotate-0"}`}>
            ▼
          </span>
        </button>
        {expandedSections.price ? (
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
        ) : null}
      </div>

      {attributes.map((attribute) => {
        const sectionKey = `attr-${attribute.id}`;
        const isOpen = !!expandedSections[sectionKey];
        const selectedOptions = filters.selectedAttributeOptionIds[attribute.id] || [];

        return (
          <div key={attribute.id} className="mb-6 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={() => toggleSection(sectionKey)}
              className="flex w-full items-center justify-between text-left"
            >
              <h4 className="font-semibold text-gray-900 dark:text-white">{attribute.name}</h4>
              <span className={`text-xs text-gray-600 dark:text-gray-400 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}>
                ▼
              </span>
            </button>

            {isOpen ? (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {attribute.options.map((option) => (
                  <label key={option.id} className="flex items-center cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(option.id)}
                      onChange={() => handleAttributeOptionToggle(attribute.id, option.id)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{option.value}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}

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
