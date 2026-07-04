"use client";

import React, { useEffect, useRef, useState } from "react";
// Fetch shops from backend
import api from "@/lib/api";
import ShopProductsRibbon from "@/components/Ribbon/ShopProductsRibbon";
import ShopsFilter, { FilterState } from "@/components/Filters/ShopsFilter";
import FilterHeader from "@/components/FilterHeader/FilterHeader";
import type { ShopStatusResponse } from "@/types/apiTypes";

export default function ShopsPage() {
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 100000],
    selectedTypes: [],
  });

  const [showFilters, setShowFilters] = useState(true);
  const [isHeaderSticky, setIsHeaderSticky] = useState(true);
  const sidebarRef = useRef<HTMLElement | null>(null);

  const [shops, setShops] = useState<ShopStatusResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsMap, setProductsMap] = useState<Record<string, any[]>>({});

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

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.shops.list();
        if (!mounted) return;
        setShops(Array.isArray(data) ? data : []);
      } catch (e) {
        // keep shops empty on error
        console.error("Failed to load shops", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // When shops load, fetch a small set of products for each shop to display in the section
  React.useEffect(() => {
    if (!shops || shops.length === 0) return;
    let mounted = true;
    const loadProducts = async () => {
      try {
        const entries = await Promise.all(
          shops.map(async (s) => {
            try {
              const items = await api.products.getProducts({ shop_display_id: s.display_id, page: 1, page_size: 6 });
              return [s.display_id, items as any[]] as const;
            } catch (e) {
              console.error("Failed to load products for shop", s.display_id, e);
              return [s.display_id, [] as any[]] as const;
            }
          }),
        );
        if (!mounted) return;
        const map: Record<string, any[]> = {};
        for (const tuple of entries) {
          const k = tuple[0];
          const v = tuple[1] as any[];
          map[k] = v;
        }
        setProductsMap(map);
      } catch (e) {
        console.error("Failed to load shop products", e);
      }
    };
    loadProducts();
    return () => {
      mounted = false;
    };
  }, [shops]);

  // For now apply no advanced filters; just use the fetched shop list
  const filteredShops = shops;
  const hasProductInRange = false;
    
  

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <section>
        <FilterHeader
          pageTitle="Shops"
          productCount={filteredShops.length}
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
                <ShopsFilter onFilterChange={setFilters} />
              </aside>
            )}

            <section className="flex-1 min-w-0">
                {loading ? (
                <div className="py-12 text-center">
                  <p className="text-slate-600">Loading shops…</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredShops.map((shop) => (
                    <ShopProductsRibbon
                      key={shop.display_id}
                      shop={shop}
                      products={productsMap?.[shop.display_id] || []}
                    />
                  ))}
                </div>
              )}
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
            and filters section move up once the shops area ends.
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
