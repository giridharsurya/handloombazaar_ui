"use client";

import React, { useState } from "react";
import { mockShops } from "@/lib/mockData";
import Shops from "@/components/Shops/Shops";
import ShopsFilter, { FilterState } from "@/components/ShopsFilter/ShopsFilter";

export default function ShopsPage() {
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 100000],
    selectedTypes: [],
  });

  return (
    <main className="min-h-screen w-full bg-white dark:bg-gray-950">
      <div className="w-full px-4">
        <div className="w-full mx-auto">
          <div className="flex gap-6">
            {/* Left: Filters */}
            <ShopsFilter onFilterChange={setFilters} />

            {/* Right: Shops Display */}
            <div className="flex-1  min-w-0">
              <Shops shops={mockShops} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
