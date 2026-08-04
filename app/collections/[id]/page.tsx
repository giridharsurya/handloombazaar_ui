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
  const [allProducts, setAllProductsState] = useState<ProductListItem[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 25000],
    selectedAttributeOptionIds: {},
  });
  const [filterAttributes, setFilterAttributes] = useState<ProductFilterAttribute[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [isHeaderSticky, setIsHeaderSticky] = useState(true);
  const sidebarRef = useRef<HTMLElement | null>(null);

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
        const [allCollections, memberResponse, catalogProducts] = await Promise.all([
          api.collections.list({ kind: "system", authenticated: false }),
          api.collections.getProducts(collectionId, { authenticated: false }),
          api.products.getProducts({ page: 1, page_size: 100, authenticated: false }),
        ]);

        if (cancelled) return;

        const collectionRow = ((allCollections || []) as Collection[]).find((c) => c.id === collectionId) || null;
        const members = (memberResponse?.items || memberResponse || []) as Array<{ display_id: string }>;

        if (!collectionRow) {
          throw new Error("Collection not found");
        }

        setCollection(collectionRow);
        setMemberIds(new Set(members.map((m) => String(m.display_id))));
        // Filter to show only active products with stock
        const visibleCatalog = (catalogProducts || []).filter(
          (p) => p.is_active !== false && Number(p.stock_quantity ?? 0) > 0
        );
        setAllProductsState(visibleCatalog);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load collection products";
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

  useEffect(() => {
    setAllProducts(allProducts);
  }, [allProducts, setAllProducts]);

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

  const memberProducts = useMemo(
    () => allProducts.filter((p) => memberIds.has(String(p.display_id))),
    [allProducts, memberIds]
  );

  const filteredProducts = useMemo(
    () =>
      memberProducts.filter((product) => {
        const priceMatch = Number(product.price ?? 0) >= filters.priceRange[0] && Number(product.price ?? 0) <= filters.priceRange[1];

        const selectedAttributeOptionIds = filters.selectedAttributeOptionIds || {};
        const attributeMatch = Object.entries(selectedAttributeOptionIds).every(([attrIdStr, selectedOptionIds]) => {
          if (!Array.isArray(selectedOptionIds) || selectedOptionIds.length === 0) return true;

          const numericAttrId = Number(attrIdStr);
          if (!Number.isFinite(numericAttrId)) return true;

          const productAttrs = product.attributes || [];
          const scopedProductAttrs = productAttrs.filter((attr) => Number(attr.definition_id) === numericAttrId);
          const productOptionIdsForAttr = new Set(
            scopedProductAttrs.map((attr) => Number(attr.option_id)).filter((id) => Number.isFinite(id))
          );
          const productOptionValuesForAttr = new Set(
            scopedProductAttrs
              .map((attr) => String(attr.option_value || "").trim().toLowerCase())
              .filter((value) => value.length > 0)
          );

          const normalizedSelectedIds = (selectedOptionIds as Array<number | string>)
            .map((selectedId) => Number(selectedId))
            .filter((id) => Number.isFinite(id));

          const idMatched = normalizedSelectedIds.some((id) => productOptionIdsForAttr.has(id));
          if (idMatched) return true;
          if (productOptionValuesForAttr.size === 0) return false;
          return Array.from(productOptionValuesForAttr).some((value) => productOptionValuesForAttr.has(value));
        });

        return priceMatch && attributeMatch;
      }),
    [memberProducts, filters, filterAttributes]
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const paginationOffset = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(paginationOffset, paginationOffset + itemsPerPage);

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
          productCount={filteredProducts.length}
          showFiltersToggle={true}
          onToggleFilters={() => setShowFilters(!showFilters)}
          filtersOpen={showFilters}
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
                <SareesFilter attributes={filterAttributes} onFilterChange={setFilters} />
              </aside>
            )}

            {/* Right Column - Product grid */}
            <section className="flex-1 min-w-0">
              <ProductGrid
                products={paginatedProducts}
                hideShop={false}
                showCheckboxes={false}
                scope="public"
                variantMode={isVariantMode}
                mainProductId={mainProductId ?? undefined}
                variantProductIds={variantProductIds}
              />
              <Pagination currentPage={currentPage} totalItems={filteredProducts.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
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
