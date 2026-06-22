"use client";

import React, { useState } from "react";
import { mockCategories } from "@/lib/mockData";
import Categories from "@/components/Categories/Categories";
import CategoriesFilter, { FilterState } from "@/components/CategoriesFilter/CategoriesFilter";

export default function CategoriesPage() {
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 50000],
    selectedMaterials: [],
  });

  return (
    <main className="min-h-screen w-full bg-white dark:bg-gray-950">
      <div className="w-full px-4">
        <div className="w-full mt-6 mx-auto">
          <div className="flex gap-6">
            {/* Left: Filters */}
            <CategoriesFilter onFilterChange={setFilters} />

            {/* Right: Categories Display */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Categories
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {mockCategories.length} products
              </p>
              <Categories categories={mockCategories} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
