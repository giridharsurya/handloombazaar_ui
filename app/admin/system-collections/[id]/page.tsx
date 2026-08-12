"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/lib/ApiProvider";
import { useAuth } from "@/lib/AuthContext";
import ProductActionsSidebar from "@/components/Product/ProductActionsSidebar";
import { VariantSelectionProvider } from "@/lib/VariantSelectionContext";
import type { Collection, ProductListItem } from "@/types/apiTypes";

type AdminCollectionOption = {
  id: number;
  name: string;
  display_id?: string;
};

type CollectionDetailsPageProps = {
  collection: Collection;
  scope: string;
  actionsSidebar: React.ReactNode;
};

// Minimal collection details wrapper - just show products tab with filters
import FilterHeader from "@/components/FilterHeader/FilterHeader";
import SareesFilter, { FilterState } from "@/components/Filters/SareesFilter";
import ProductGrid from "@/components/Product/ProductGrid";
import SelectionToolbar from "@/components/Product/SelectionToolbar";
import Pagination from "@/components/Product/Pagination";
import { useProductActions } from "@/lib/productActions";
import { useVariantSelection } from "@/lib/VariantSelectionContext";
import type { ProductFilterAttribute } from "@/types/apiTypes";
import { useRef } from "react";

function CollectionDetailsPage({
  collection,
  scope,
  actionsSidebar,
}: CollectionDetailsPageProps) {
  const api = useApi();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [pageProducts, setPageProducts] = useState<ProductListItem[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 25000],
    selectedAttributeOptionIds: {},
  });
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "newest" | "most-viewed">("newest");
  const [showFilters, setShowFilters] = useState(true);

  const handleSortChange = (sort: "price-low" | "price-high" | "newest" | "most-viewed" | "product-count") => {
    if (sort === "product-count") return;
    setSortBy(sort);
  };
  const [isHeaderSticky, setIsHeaderSticky] = useState(true);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const productsSectionRef = useRef<HTMLElement | null>(null);
  const [filterAttributes, setFilterAttributes] = useState<ProductFilterAttribute[]>([]);

  const { actionCollectionQuery, setAllProducts } = useProductActions();
  const { isVariantMode, mainProductId, variantProductIds } = useVariantSelection();

  const selectedAttributeOptionIds = useMemo(
    () =>
      Object.values(filters.selectedAttributeOptionIds)
        .flat()
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id)),
    [filters]
  );

  const queryCollectionId = actionCollectionQuery?.collectionId ?? collection.id;
  const queryMode = actionCollectionQuery?.mode ?? "view";

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setLoadingProducts(true);
      setProductsError("");
      try {
        const pageData = await api.collections.getProductsPage(queryCollectionId, {
          authenticated: true,
          mode: queryMode,
          page: currentPage,
          page_size: itemsPerPage,
          min_price: filters.priceRange[0],
          max_price: filters.priceRange[1],
          sort_by: sortBy,
          attribute_option_ids: selectedAttributeOptionIds,
          source_collection_id: queryMode !== "view" ? collection.id : undefined,
        });
        if (cancelled) return;
        setPageProducts(pageData.items || []);
        setTotalProducts(pageData.total_count || 0);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load collection products";
        setProductsError(msg);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [api, currentPage, itemsPerPage, filters, sortBy, selectedAttributeOptionIds, queryCollectionId, queryMode]);

  useEffect(() => {
    setAllProducts(pageProducts);
  }, [pageProducts, setAllProducts]);

  // Reset to page 1 when filters, sort order, or action mode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, queryCollectionId, queryMode]);

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

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <section ref={productsSectionRef}>
        <FilterHeader
          pageTitle={collection.name}
          productCount={totalProducts}
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
              <SelectionToolbar scope={scope} visibleIds={pageProducts.map((p) => p.display_id)} />
              <ProductGrid
                products={pageProducts}
                hideShop={true}
                showCheckboxes={true}
                scope={scope}
                variantMode={isVariantMode}
                mainProductId={mainProductId ?? undefined}
                variantProductIds={variantProductIds}
              />
              <Pagination currentPage={currentPage} totalItems={totalProducts} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
              {loadingProducts ? <div className="mt-3 text-sm text-slate-600">Loading products...</div> : null}
              {productsError ? <div className="mt-3 text-sm text-rose-600">{productsError}</div> : null}
            </section>

            {actionsSidebar}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function AdminSystemCollectionProductsPage() {
  const params = useParams<{ id: string }>();
  const collectionId = Number(params?.id);
  const { auth, isLoading } = useAuth();
  const router = useRouter();
  const api = useApi();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !auth) {
      router.push("/auth/login");
      return;
    }
    if (!isLoading && auth && auth.role !== "admin") {
      router.push("/");
    }
  }, [isLoading, auth, router]);

  useEffect(() => {
    if (isLoading || !auth || auth.role !== "admin") return;

    if (!Number.isFinite(collectionId)) {
      setError("Invalid collection id.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadCollectionData = async () => {
      setLoading(true);
      setError("");
      try {
        const allCollections = await api.collections.list({ kind: "system", authenticated: true });

        if (cancelled) return;

        const collectionRow = ((allCollections || []) as Collection[]).find((c) => c.id === collectionId);
        if (!collectionRow) {
          setError("Collection not found");
          return;
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

    loadCollectionData();

    return () => {
      cancelled = true;
    };
  }, [api, auth, collectionId, isLoading]);

  if (isLoading) {
    return <div className="px-4 py-6 text-sm">Loading auth...</div>;
  }

  if (!auth || auth.role !== "admin") {
    return null;
  }

  if (loading) {
    return <div className="px-4 py-6 text-sm">Loading collection...</div>;
  }

  if (error) {
    return <div className="px-4 py-6 text-sm text-rose-600">{error}</div>;
  }

  if (!collection) {
    return <div className="px-4 py-6 text-sm">Collection not found.</div>;
  }

  return (
    <VariantSelectionProvider>
      <CollectionDetailsPage
        collection={collection}
        scope="admin"
        actionsSidebar={<ProductActionsSidebar scope="admin" />}
      />
    </VariantSelectionProvider>
  );
}
