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
        <div className="w-full mx-auto">
          <div className="flex gap-6">
            {/* Left: Filters */}
            <CategoriesFilter onFilterChange={setFilters} />

            {/* Right: Categories Display */}
            <div className="flex-1 min-w-0">
              <Categories categories={mockCategories} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
