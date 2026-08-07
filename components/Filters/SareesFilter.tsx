"use client";

import React, { useState } from "react";
import { ProductFilterAttribute } from "@/types/apiTypes";

type SareesFilterProps = {
  attributes: ProductFilterAttribute[];
  value?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
};

export type FilterState = {
  priceRange: [number, number];
  selectedAttributeOptionIds: Record<number, number[]>;
};

const DEFAULT_FILTERS: FilterState = {
  priceRange: [0, 25000],
  selectedAttributeOptionIds: {},
};

export default function SareesFilter({ attributes, value, onFilterChange }: SareesFilterProps) {
  const DEBUG_FILTERS = true;
  const [draftFilters, setDraftFilters] = useState<FilterState>(value ?? DEFAULT_FILTERS);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
  });

  const externalFilters = value ?? DEFAULT_FILTERS;
  const hasPendingChanges = JSON.stringify(draftFilters) !== JSON.stringify(externalFilters);
  const hasActiveFilters = JSON.stringify(externalFilters) !== JSON.stringify(DEFAULT_FILTERS);
  const applyButtonLabel = hasPendingChanges || !hasActiveFilters ? "Apply Filters" : "Filters Applied";
  const resetButtonClassName = hasActiveFilters
    ? "flex-1 rounded-md border border-rose-600 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 dark:bg-gray-800 dark:text-rose-300 dark:hover:border-rose-500"
    : "flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-rose-600 hover:text-rose-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-rose-500";

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextMin = Math.min(Number(e.target.value), draftFilters.priceRange[1]);
    const newFilters: FilterState = {
      ...draftFilters,
      priceRange: [nextMin, draftFilters.priceRange[1]],
    };
    setDraftFilters(newFilters);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextMax = Math.max(Number(e.target.value), draftFilters.priceRange[0]);
    const newFilters: FilterState = {
      ...draftFilters,
      priceRange: [draftFilters.priceRange[0], nextMax],
    };
    setDraftFilters(newFilters);
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAttributeOptionToggle = (attributeId: number, optionId: number) => {
    const current = draftFilters.selectedAttributeOptionIds[attributeId] || [];
    const updated = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];

    const newFilters: FilterState = {
      ...draftFilters,
      selectedAttributeOptionIds: {
        ...draftFilters.selectedAttributeOptionIds,
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
    setDraftFilters(newFilters);
  };

  const handleApply = () => {
    if (!hasPendingChanges) {
      return;
    }
    if (DEBUG_FILTERS) {
      console.log("[SareesFilter][Apply] Applying filters", draftFilters);
    }
    onFilterChange?.(draftFilters);
  };

  const handleReset = () => {
    if (DEBUG_FILTERS) {
      console.log("[SareesFilter][Reset] Filters reset", DEFAULT_FILTERS);
    }
    setDraftFilters(DEFAULT_FILTERS);
    onFilterChange?.(DEFAULT_FILTERS);
  };

  React.useEffect(() => {
    if (!value) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftFilters(value);
  }, [value]);

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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <span>Min</span>
                <input
                  type="number"
                  min={0}
                  max={draftFilters.priceRange[1]}
                  value={draftFilters.priceRange[0]}
                  onChange={handleMinPriceChange}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-rose-500 focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <span>Max</span>
                <input
                  type="number"
                  min={draftFilters.priceRange[0]}
                  max={25000}
                  value={draftFilters.priceRange[1]}
                  onChange={handleMaxPriceChange}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-rose-500 focus:outline-none"
                />
              </label>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Range: ₹{draftFilters.priceRange[0].toLocaleString()} - ₹{draftFilters.priceRange[1].toLocaleString()}
              </label>
              <div className="space-y-4 mt-2">
                <input
                  type="range"
                  min="0"
                  max="25000"
                  step="1000"
                  value={draftFilters.priceRange[0]}
                  onChange={handleMinPriceChange}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="25000"
                  step="1000"
                  value={draftFilters.priceRange[1]}
                  onChange={handleMaxPriceChange}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {attributes.map((attribute) => {
        const sectionKey = `attr-${attribute.id}`;
        const isOpen = !!expandedSections[sectionKey];
        const selectedOptions = draftFilters.selectedAttributeOptionIds[attribute.id] || [];

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

      <div className="mb-3 text-sm text-gray-500 dark:text-gray-400">
        Changes are applied only after clicking the button below.
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleApply}
          disabled={!hasPendingChanges}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors ${hasPendingChanges ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"} disabled:cursor-not-allowed disabled:bg-emerald-300`}
        >
          {applyButtonLabel}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className={resetButtonClassName}
        >
          Reset Filters
        </button>
      </div>
      {hasActiveFilters ? (
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">Filters are active and will persist until reset.</p>
      ) : (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No filters are currently active.</p>
      )}
    </aside>
  );
}
