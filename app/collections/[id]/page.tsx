"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "@/lib/ApiProvider";
import { useProductActions } from "@/lib/productActions";
import ProductGrid from "@/components/Product/ProductGrid";
import { VariantSelectionProvider, useVariantSelection } from "@/lib/VariantSelectionContext";
import Pagination from "@/components/Product/Pagination";
import FilterHeader from "@/components/FilterHeader/FilterHeader";
import SareesFilter, { FilterState } from "@/components/Filters/SareesFilter";
import type { Collection, ProductListItem, ProductFilterAttribute } from "@/types/apiTypes";

function SystemCollectionProductsInner() {
  const params = useParams<{ id: string }>();
  const collectionId = Number(params?.id);
  const api = useApi();
  const { setAllProducts } = useProductActions();
  const { isVariantMode, mainProductId, variantProductIds } = useVariantSelection();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [pageProducts, setPageProducts] = useState<ProductListItem[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 25000],
    selectedAttributeOptionIds: {},
  });
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "newest" | "most-viewed">("newest");
  const [filterAttributes, setFilterAttributes] = useState<ProductFilterAttribute[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [isHeaderSticky, setIsHeaderSticky] = useState(true);
  const sidebarRef = useRef<HTMLElement | null>(null);

  const selectedAttributeOptionIds = useMemo(
    () =>
      Object.values(filters.selectedAttributeOptionIds)
        .flat()
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id)),
    [filters]
  );

  useEffect(() => {
    if (!Number.isFinite(collectionId)) {
      setError("Invalid collection id.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const allCollections = await api.collections.list({ kind: "system", authenticated: false });

        if (cancelled) return;

        const collectionRow = ((allCollections || []) as Collection[]).find((c) => c.id === collectionId) || null;

        if (!collectionRow) {
          throw new Error("Collection not found");
        }

        setCollection(collectionRow);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load collection";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [api, collectionId]);

  // Fetch products with server-side filtering and pagination
  useEffect(() => {
    if (!Number.isFinite(collectionId)) return;

    let cancelled = false;

    const loadProducts = async () => {
      setLoadingProducts(true);
      setProductsError("");
      try {
        const pageData = await api.collections.getProductsPage(collectionId, {
          authenticated: false,
          mode: "view",
          track_view: true,
          page: currentPage,
          page_size: itemsPerPage,
          min_price: filters.priceRange[0],
          max_price: filters.priceRange[1],
          sort_by: sortBy,
          attribute_option_ids: selectedAttributeOptionIds,
        });

        if (cancelled) return;
        setPageProducts(pageData.items || []);
        setTotalProducts(pageData.total_count || 0);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load collection products";
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
  }, [api, collectionId, currentPage, itemsPerPage, filters, selectedAttributeOptionIds, sortBy]);

  useEffect(() => {
    let mounted = true;

    const loadFilterAttributes = async () => {
      try {
        const attrs = await api.products.getFilterAttributes();
        if (mounted) setFilterAttributes(attrs);
      } catch {
        if (mounted) setFilterAttributes([]);
      }
    };

    loadFilterAttributes();

    return () => {
      mounted = false;
    };
  }, [api]);

  useEffect(() => {
    let mounted = true;

    const getStickyTop = () => {
      const rootStyles = getComputedStyle(document.documentElement);
      const appHeaderHeight = Number.parseFloat(rootStyles.getPropertyValue("--app-header-height")) || 120;
      const filterHeaderHeight = Number.parseFloat(rootStyles.getPropertyValue("--filter-header-height")) || 72;
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

  // Reset to page 1 when filters or sort order change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  if (loading) {
    return <div className="px-4 py-6 text-sm text-slate-600">Loading collection...</div>;
  }

  if (error) {
    return <div className="px-4 py-6 text-sm text-rose-600">{error}</div>;
  }

  if (!collection) {
    return <div className="px-4 py-6 text-sm text-slate-600">Collection not found.</div>;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <section>
        <FilterHeader
          pageTitle={`Collections - ${collection.name}`}
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
            {/* Left Column - Filter panel */}
            {showFilters && (
              <aside
                ref={sidebarRef}
                className="w-64 shrink-0 sticky self-start"
                style={{
                  top: "calc(var(--app-header-height, 120px) + var(--filter-header-height, 72px))",
                }}
              >
                <SareesFilter attributes={filterAttributes} value={filters} onFilterChange={setFilters} />
              </aside>
            )}

            {/* Right Column - Product grid */}
            <section className="flex-1 min-w-0">
              <ProductGrid
                products={pageProducts}
                hideShop={false}
                showCheckboxes={false}
                scope="public"
                variantMode={isVariantMode}
                mainProductId={mainProductId ?? undefined}
                variantProductIds={variantProductIds}
              />
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

export default function SystemCollectionProductsPage() {
  return (
    <VariantSelectionProvider>
      <SystemCollectionProductsInner />
    </VariantSelectionProvider>
  );
}
