"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useApi } from "@/lib/ApiProvider";
import { ProductFilterAttribute, ProductListItem } from "@/types/apiTypes";
import ProductGrid from "@/components/Product/ProductGrid";
import SelectionToolbar from "@/components/Product/SelectionToolbar";
import SareesFilter, { FilterState } from "@/components/Filters/SareesFilter";
import FilterHeader from "@/components/FilterHeader/FilterHeader";
import Pagination from "@/components/Product/Pagination";

export default function SareesPage() {
  const searchParams = useSearchParams();
  const collectionIdParam = searchParams.get("collection_id");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 25000],
    selectedAttributeOptionIds: {},
  });

  const [showFilters, setShowFilters] = useState(true);
  const [isHeaderSticky, setIsHeaderSticky] = useState(true);
  const sidebarRef = useRef<HTMLElement | null>(null);

  const [pageProducts, setPageProducts] = useState<ProductListItem[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [filterAttributes, setFilterAttributes] = useState<ProductFilterAttribute[]>([]);
  const [collectionFilterName, setCollectionFilterName] = useState<string | null>(null);

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

  // Fetch products with server-side filtering and pagination
  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setLoadingProducts(true);
      setProductsError("");
      try {
        let pageData;
        if (collectionIdParam) {
          const numericCollectionId = Number(collectionIdParam);
          if (Number.isFinite(numericCollectionId)) {
            pageData = await api.collections.getProductsPage(numericCollectionId, {
              authenticated: false,
              mode: "view",
              page: currentPage,
              page_size: itemsPerPage,
              min_price: filters.priceRange[0],
              max_price: filters.priceRange[1],
              attribute_option_ids: selectedAttributeOptionIds,
            });
          } else {
            pageData = {
              page: currentPage,
              page_size: itemsPerPage,
              total_count: 0,
              has_next: false,
              items: [],
            };
          }
        } else {
          pageData = await api.products.getProductsPage({
            authenticated: false,
            page: currentPage,
            page_size: itemsPerPage,
            min_price: filters.priceRange[0],
            max_price: filters.priceRange[1],
            attribute_option_ids: selectedAttributeOptionIds,
          });
        }

        if (cancelled) return;
        setPageProducts(pageData.items || []);
        setTotalProducts(pageData.total_count || 0);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load products";
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
  }, [api, currentPage, itemsPerPage, filters, selectedAttributeOptionIds, collectionIdParam]);

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

  // Fetch collection name if filtering by collection
  useEffect(() => {
    let mounted = true;

    const loadCollectionName = async () => {
      if (!collectionIdParam) {
        if (mounted) setCollectionFilterName(null);
        return;
      }

      const numericId = Number(collectionIdParam);
      if (!Number.isFinite(numericId)) {
        if (mounted) setCollectionFilterName(null);
        return;
      }

      try {
        const allCollections = await api.collections.list({ authenticated: false });
        const collectionName = (allCollections || []).find((c: any) => Number(c.id) === numericId)?.name || null;
        if (mounted) setCollectionFilterName(collectionName);
      } catch {
        if (mounted) setCollectionFilterName(null);
      }
    };

    loadCollectionName();

    return () => {
      mounted = false;
    };
  }, [api, collectionIdParam]);

  // Reset to page 1 when filters or collection changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, collectionIdParam]);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <section>
        <FilterHeader
          pageTitle={collectionFilterName ? `Sarees - ${collectionFilterName}` : "Sarees"}
          productCount={totalProducts}
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
                  attributes={filterAttributes}
                  value={filters}
                  onFilterChange={setFilters}
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
