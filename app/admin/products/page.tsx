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
  const { actionViewIds, setAllProducts } = useProductActions();
  const { isVariantMode, mainProductId, variantProductIds } = useVariantSelection();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [allProducts, setAllProductsState] = useState<ProductListItem[]>([]);
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
  const productsSectionRef = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    if (isLoading || !auth || auth.role !== "admin") return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const products = await api.products.getProducts({
          page: 1,
          page_size: 100,
          authenticated: true,
        });

        if (cancelled) return;
        setAllProductsState(products || []);
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
  }, [api, auth, isLoading]);

  useEffect(() => {
    setAllProducts(allProducts);
  }, [allProducts, setAllProducts]);

  const filteredProducts = useMemo(
    () =>
      allProducts.filter((product) => {
        const priceMatch =
          product.price >= filters.priceRange[0] &&
          product.price <= filters.priceRange[1];

        const selectedByAttribute = Object.entries(filters.selectedAttributeOptionIds).filter(([, ids]) => ids.length > 0);
        const attributeMatch = selectedByAttribute.every(([attrId, selectedOptionIds]) => {
          const numericAttrId = Number(attrId);
          if (!Number.isFinite(numericAttrId)) return true;

          const selectedAttribute = filterAttributes.find((attr) => Number(attr.id) === numericAttrId);
          const selectedOptionValues = new Set(
            (selectedAttribute?.options || [])
              .filter((opt) => (selectedOptionIds as Array<number | string>).some((selectedId) => Number(selectedId) === Number(opt.id)))
              .map((opt) => String(opt.value).trim().toLowerCase())
          );

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
          if (selectedOptionValues.size === 0) return false;
          return Array.from(selectedOptionValues).some((value) => productOptionValuesForAttr.has(value));
        });

        return priceMatch && attributeMatch;
      }),
    [allProducts, filters, filterAttributes]
  );

  const visibleProducts = useMemo(() => {
    if (!actionViewIds) return filteredProducts;
    const idSet = new Set(actionViewIds.map(String));
    return filteredProducts.filter((p) => idSet.has(String(p.display_id)));
  }, [actionViewIds, filteredProducts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const paginationOffset = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = visibleProducts.slice(paginationOffset, paginationOffset + itemsPerPage);

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

  if (isLoading) {
    return <div className="px-4 py-6 text-sm text-slate-600">Loading auth...</div>;
  }

  if (!auth || auth.role !== "admin") {
    return null;
  }

  if (loading) {
    return <div className="px-4 py-6 text-sm text-slate-600">Loading products...</div>;
  }

  if (error) {
    return <div className="px-4 py-6 text-sm text-rose-600">{error}</div>;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <section ref={productsSectionRef}>
        <FilterHeader
          pageTitle="All Products"
          productCount={visibleProducts.length}
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
                <SareesFilter attributes={filterAttributes} onFilterChange={setFilters} />
              </aside>
            )}

            <section className="flex-1 min-w-0">
              <SelectionToolbar scope="admin" visibleIds={paginatedProducts.map((p) => p.display_id)} />
              <ProductGrid
                products={paginatedProducts}
                hideShop={false}
                showCheckboxes={true}
                scope="admin"
                variantMode={isVariantMode}
                mainProductId={mainProductId ?? undefined}
                variantProductIds={variantProductIds}
              />
              <Pagination currentPage={currentPage} totalItems={visibleProducts.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
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
