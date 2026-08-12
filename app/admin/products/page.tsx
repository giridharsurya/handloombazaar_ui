"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/ApiProvider";
import { useAuth } from "@/lib/AuthContext";
import ProductActionsSidebar from "@/components/Product/ProductActionsSidebar";
import { VariantSelectionProvider } from "@/lib/VariantSelectionContext";
import FilterHeader from "@/components/FilterHeader/FilterHeader";
import SareesFilter, { FilterState } from "@/components/Filters/SareesFilter";
import ProductGrid from "@/components/Product/ProductGrid";
import SelectionToolbar from "@/components/Product/SelectionToolbar";
import Pagination from "@/components/Product/Pagination";
import { useProductActions } from "@/lib/productActions";
import { useVariantSelection } from "@/lib/VariantSelectionContext";
import type { ProductFilterAttribute, ProductListItem } from "@/types/apiTypes";

function AllProductsPageInner() {
  const router = useRouter();
  const api = useApi();
  const { auth, isLoading } = useAuth();
  const { actionViewIds, actionCollectionQuery, setAllProducts } = useProductActions();
  const { isVariantMode, mainProductId, variantProductIds } = useVariantSelection();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [pageProducts, setPageProducts] = useState<ProductListItem[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
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
  const productsSectionRef = useRef<HTMLElement | null>(null);

  const handleSortChange = (sort: "price-low" | "price-high" | "newest" | "most-viewed" | "product-count") => {
    if (sort === "product-count") {
      return;
    }
    setSortBy(sort);
  };

  useEffect(() => {
    if (isLoading) return;
    if (!auth) {
      router.push("/auth/login");
      return;
    }
    if (auth.role !== "admin") {
      router.push("/");
    }
  }, [auth, isLoading, router]);

  const selectedAttributeOptionIds = useMemo(
    () =>
      Object.values(filters.selectedAttributeOptionIds)
        .flat()
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id)),
    [filters]
  );

  useEffect(() => {
    if (isLoading || !auth || auth.role !== "admin") return;

    let cancelled = false;

    const load = async () => {
      console.log("[AllProductsPage] load products effect", { currentPage, filters, selectedAttributeOptionIds, actionCollectionQuery });
      setLoading(true);
      setError("");
      try {
        const commonFilters = {
          page: currentPage,
          page_size: itemsPerPage,
          min_price: filters.priceRange[0],
          max_price: filters.priceRange[1],
          sort_by: sortBy,
          attribute_option_ids: selectedAttributeOptionIds,
          authenticated: true,
        } as const;

        const pageData = actionCollectionQuery
          ? await api.collections.getProductsPage(actionCollectionQuery.collectionId, {
              ...commonFilters,
              mode: actionCollectionQuery.mode,
            })
          : await api.products.getProductsPage(commonFilters);

        console.log("[AllProductsPage] products loaded", { actionCollectionQuery, pageDataCount: pageData.items?.length, totalCount: pageData.total_count });
        if (cancelled) return;
        setPageProducts(pageData.items || []);
        setTotalProducts(pageData.total_count || 0);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load products";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [api, auth, isLoading, currentPage, filters, sortBy,selectedAttributeOptionIds, itemsPerPage, actionCollectionQuery]);

  const visibleProducts = useMemo(() => {
    if (actionCollectionQuery) return pageProducts;
    if (!actionViewIds) return pageProducts;
    const idSet = new Set(actionViewIds.map(String));
    return pageProducts.filter((p) => idSet.has(String(p.display_id)));
  }, [actionViewIds, pageProducts, actionCollectionQuery]);

  useEffect(() => {
    setAllProducts(visibleProducts);
  }, [visibleProducts, setAllProducts]);

  // Reset to page 1 when filters or action collection mode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, actionCollectionQuery]);

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

  const isInitialLoading = loading && pageProducts.length === 0;

  if (isLoading) {
    return <div className="px-4 py-6 text-sm text-slate-600">Loading auth...</div>;
  }

  if (!auth || auth.role !== "admin") {
    return null;
  }

  if (isInitialLoading) {
    return <div className="px-4 py-6 text-sm text-slate-600">Loading products...</div>;
  }

  if (error && pageProducts.length === 0) {
    return <div className="px-4 py-6 text-sm text-rose-600">{error}</div>;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <section ref={productsSectionRef}>
        <FilterHeader
          pageTitle="All Products"
          productCount={actionCollectionQuery ? totalProducts : (actionViewIds ? visibleProducts.length : totalProducts)}
          showFiltersToggle={true}
          onToggleFilters={() => setShowFilters(!showFilters)}
          filtersOpen={showFilters}
          sortBy={sortBy}
          onSortChange={handleSortChange}
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
                <SareesFilter attributes={filterAttributes} value={filters} onFilterChange={setFilters} />
              </aside>
            )}

            <section className="flex-1 min-w-0">
              <SelectionToolbar scope="admin" visibleIds={visibleProducts.map((p) => p.display_id)} />
              <ProductGrid
                products={visibleProducts}
                hideShop={false}
                showCheckboxes={true}
                scope="admin"
                variantMode={isVariantMode}
                mainProductId={mainProductId ?? undefined}
                variantProductIds={variantProductIds}
              />
              {loading ? (
                <p className="mt-3 text-sm text-slate-600">Updating products...</p>
              ) : null}
              {error ? (
                <p className="mt-3 text-sm text-rose-600">{error}</p>
              ) : null}
              <Pagination
                currentPage={currentPage}
                totalItems={actionCollectionQuery ? totalProducts : (actionViewIds ? visibleProducts.length : totalProducts)}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </section>

            <div className="w-80 shrink-0">
              <ProductActionsSidebar scope="admin" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function AllProductsPage() {
  return (
    <VariantSelectionProvider>
      <AllProductsPageInner />
    </VariantSelectionProvider>
  );
}
