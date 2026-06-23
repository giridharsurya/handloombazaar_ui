"use client";

import React, { useEffect, useRef, useState } from "react";
import { mockCategories, mockSarees } from "@/lib/mockData";
import Categories from "@/components/Categories/Categories";
import CategoriesFilter, { FilterState } from "@/components/CategoriesFilter/CategoriesFilter";
import FilterHeader from "@/components/FilterHeader/FilterHeader";

export default function CategoriesPage() {
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 50000],
    selectedMaterials: [],
  });

  const [showFilters, setShowFilters] = useState(true);
  const [isHeaderSticky, setIsHeaderSticky] = useState(true);
  const sidebarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const getStickyTop = () => {
      const rootStyles = getComputedStyle(document.documentElement);
      const appHeaderHeight =
        Number.parseFloat(rootStyles.getPropertyValue("--app-header-height")) || 120;
      const filterHeaderHeight =
        Number.parseFloat(rootStyles.getPropertyValue("--filter-header-height")) || 72;
      return appHeaderHeight + filterHeaderHeight;
    };

    const updateHeaderSticky = () => {
      if (!showFilters || !sidebarRef.current) {
        setIsHeaderSticky(true);
        return;
      }

      const stickyTop = getStickyTop();
      const sidebarTop = sidebarRef.current.getBoundingClientRect().top;
      setIsHeaderSticky(sidebarTop >= stickyTop - 1);
    };

    updateHeaderSticky();
    window.addEventListener("scroll", updateHeaderSticky, { passive: true });
    window.addEventListener("resize", updateHeaderSticky);

    return () => {
      window.removeEventListener("scroll", updateHeaderSticky);
      window.removeEventListener("resize", updateHeaderSticky);
    };
  }, [showFilters]);

  const filteredCategories = mockCategories.filter((category) => {
    const categoryProducts = mockSarees.filter(
      (product) => product.category === category.name
    );

    const hasProductInRange = categoryProducts.some(
      (product) =>
        product.price >= filters.priceRange[0] &&
        product.price <= filters.priceRange[1]
    );

    const materialMatch =
      filters.selectedMaterials.length === 0 ||
      filters.selectedMaterials.some((material) => {
        const normalizedMaterial = material.toLowerCase();
        return categoryProducts.some((product) =>
          product.title.toLowerCase().includes(normalizedMaterial)
        );
      });

    return hasProductInRange && materialMatch;
  });

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <section>
        <FilterHeader
          pageTitle="Categories"
          productCount={filteredCategories.length}
          showFiltersToggle={true}
          onToggleFilters={() => setShowFilters(!showFilters)}
          filtersOpen={showFilters}
          isSticky={isHeaderSticky}
        />

        <div className="px-4 py-4">
          <div className="flex gap-6 items-start">
            {showFilters && (
              <aside
                ref={sidebarRef}
                className="w-64 shrink-0 sticky self-start"
                style={{
                  top: "calc(var(--app-header-height, 120px) + var(--filter-header-height, 72px))",
                }}
              >
                <CategoriesFilter onFilterChange={setFilters} />
              </aside>
            )}

            <section className="flex-1 min-w-0">
              <Categories categories={filteredCategories} />
            </section>
          </div>
        </div>
      </section>

      <div className="px-4 pb-8">
        <section className="mt-16 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Sample Footer Content
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            This is temporary placeholder content to validate that the filter header
            and filters section move up once the categories area ends.
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Replace this block later with links, copyright text, newsletter signup,
            policy links, or any other end-of-page content.
          </p>
        </section>
      </div>
    </main>
  );
}
