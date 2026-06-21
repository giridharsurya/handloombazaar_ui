"use client";

import React, { useState } from "react";
import { mockSarees, mockCategories } from "@/lib/mockData";
import ProductGrid from "@/components/ProductGrid/ProductGrid";
import SareesFilter, { FilterState } from "@/components/SareesFilter/SareesFilter";

export default function SareesPage() {
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 25000],
    selectedCategories: [],
  });

  // Filter sarees based on selected filters
  const filteredSarees = mockSarees.filter((saree) => {
    const priceMatch =
      saree.price >= filters.priceRange[0] &&
      saree.price <= filters.priceRange[1];

    const categoryMatch =
      filters.selectedCategories.length === 0 ||
      filters.selectedCategories.includes(saree.category);

    return priceMatch && categoryMatch;
  });

  const categoryNames = mockCategories.map((cat) => cat.name);

  return (
    <main className="min-h-screen w-full bg-white dark:bg-gray-950">
      <div className="w-full py-8 px-4">
        <div className="w-full mx-auto">
          <div className="flex gap-6">
            {/* Left: Filters */}
            <SareesFilter categories={categoryNames} onFilterChange={setFilters} />

            {/* Right: Products Display */}
            <div className="flex-1 min-w-0">
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredSarees.length} sarees
                </p>
              </div>
              <ProductGrid products={filteredSarees} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
