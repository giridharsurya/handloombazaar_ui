"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import ProductGrid from "@/components/Product/ProductGrid";
import SelectionToolbar from "@/components/Product/SelectionToolbar";
import SareesFilter, { FilterState } from "@/components/Filters/SareesFilter";
import FilterHeader from "@/components/FilterHeader/FilterHeader";
import Pagination from "@/components/Product/Pagination";
import { Collection, ProductFilterAttribute, ProductListItem } from "@/types/apiTypes";
import { useApi } from "@/lib/ApiProvider";

export default function FeaturedPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 25000],
    selectedAttributeOptionIds: {},
  });
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "newest">("newest");
  const [filterAttributes, setFilterAttributes] = useState<ProductFilterAttribute[]>([]);
  const [pageProducts, setPageProducts] = useState<ProductListItem[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [showFilters, setShowFilters] = useState(true);
  const [isHeaderSticky, setIsHeaderSticky] = useState(true);
  const sidebarRef = useRef<HTMLElement | null>(null);

  const api = useApi();

  const selectedAttributeOptionIds = useMemo(
    () =>
      Object.values(filters.selectedAttributeOptionIds)
        .flat()
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id)),
    [filters]
  );

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

  // Fetch featured products with server-side filtering and pagination
  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setLoadingProducts(true);
      setProductsError("");
      try {
        const collections = (await api.collections.list({ kind: "system", authenticated: false })) as Collection[];
        if (cancelled) return;

        const featured = collections.find(
          (collection) => /featured/i.test(collection.name) || /featured/i.test(collection.display_id)
        );

        if (!featured) {
          setPageProducts([]);
          setTotalProducts(0);
          setProductsError("No featured collection found.");
          return;
        }

        const pageData = await api.collections.getProductsPage(featured.id, {
          authenticated: false,
          page: currentPage,
          page_size: itemsPerPage,
          min_price: filters.priceRange[0],
          max_price: filters.priceRange[1],
          sort_by: sortBy,
          attribute_option_ids: selectedAttributeOptionIds,
        });

        if (cancelled) return;
        const activeItems = (pageData.items || []).filter((item) => item.is_active !== false);
        setPageProducts(activeItems);
        setTotalProducts(pageData.total_count || 0);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load featured products";
        setProductsError(msg);
        setPageProducts([]);
        setTotalProducts(0);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [api, currentPage, itemsPerPage, filters, selectedAttributeOptionIds, sortBy]);

  useEffect(() => {
    let mounted = true;

    const fetchFilterAttributes = async () => {
      try {
        const attributes = await api.products.getFilterAttributes();
        if (mounted) setFilterAttributes(attributes);
      } catch {
        if (mounted) setFilterAttributes([]);
      }
    };

    fetchFilterAttributes();

    return () => {
      mounted = false;
    };
  }, [api]);

  // Reset to page 1 when filters or sort order change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  const handleFilterChange = (nextFilters: FilterState) => {
    setFilters(nextFilters);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <section>
        <FilterHeader
          pageTitle="Featured Sarees"
          productCount={totalProducts}
          showFiltersToggle={true}
          onToggleFilters={() => setShowFilters(!showFilters)}
          filtersOpen={showFilters}
          sortBy={sortBy}
          onSortChange={setSortBy}
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
                  attributes={filterAttributes}
                  value={filters}
                  onFilterChange={handleFilterChange}
                />
              </aside>
            )}

            <section className="flex-1 min-w-0">
              <SelectionToolbar visibleIds={pageProducts.map((p) => p.display_id)} scope="public" />
              <ProductGrid products={pageProducts} hideShop={false} showCheckboxes={true} scope="public" />
              <Pagination currentPage={currentPage} totalItems={totalProducts} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
              {loadingProducts ? <p className="mt-3 text-sm text-slate-600">Loading products...</p> : null}
              {productsError ? <p className="mt-3 text-sm text-rose-600">{productsError}</p> : null}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
