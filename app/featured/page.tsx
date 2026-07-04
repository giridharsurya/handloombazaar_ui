"use client";

import React, { useEffect, useRef, useState } from "react";
// mock data removed; featured products should be fetched from API
import ProductGrid from "@/components/Product/ProductGrid";
import SareesFilter, { FilterState } from "@/components/Filters/SareesFilter";
import FilterHeader from "@/components/FilterHeader/FilterHeader";

export default function FeaturedPage() {
  const featuredProducts: any[] = [];

  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 25000],
    selectedCategories: [],
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

  const filteredFeatured = featuredProducts.filter((product) => {
    const priceMatch =
      product.price >= filters.priceRange[0] &&
      product.price <= filters.priceRange[1];

    const categoryMatch =
      filters.selectedCategories.length === 0 ||
      filters.selectedCategories.includes(product.category);

    return priceMatch && categoryMatch;
  });

  const categoryNames: string[] = [];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <section>
        <FilterHeader
          pageTitle="Featured Sarees"
          productCount={filteredFeatured.length}
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
                <SareesFilter
                  categories={categoryNames}
                  onFilterChange={setFilters}
                />
              </aside>
            )}

            <section className="flex-1 min-w-0">
              <ProductGrid products={filteredFeatured} />
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
