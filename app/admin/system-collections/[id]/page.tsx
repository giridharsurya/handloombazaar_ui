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
  products: ProductListItem[];
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
  products,
  scope,
  actionsSidebar,
}: CollectionDetailsPageProps) {
  const api = useApi();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [displayProducts, setDisplayProducts] = useState<ProductListItem[]>(products);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 25000],
    selectedAttributeOptionIds: {},
  });
  const [showFilters, setShowFilters] = useState(true);
  const [isHeaderSticky, setIsHeaderSticky] = useState(true);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const productsSectionRef = useRef<HTMLElement | null>(null);
  const [filterAttributes, setFilterAttributes] = useState<ProductFilterAttribute[]>([]);

  const { actionViewIds, setAllProducts } = useProductActions();
  const { isVariantMode, mainProductId, variantProductIds } = useVariantSelection();

  useEffect(() => {
    setDisplayProducts(products);
    setAllProducts(products);
  }, [products, setAllProducts]);

  const filteredProducts = useMemo(
    () =>
      displayProducts.filter((product) => {
        const priceMatch = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];

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
    [displayProducts, filters, filterAttributes]
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

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <section ref={productsSectionRef}>
        <FilterHeader
          pageTitle={collection.name}
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
              <SelectionToolbar scope={scope} visibleIds={paginatedProducts.map((p) => p.display_id)} />
              <ProductGrid
                products={paginatedProducts}
                hideShop={true}
                showCheckboxes={true}
                scope={scope}
                variantMode={isVariantMode}
                mainProductId={mainProductId ?? undefined}
                variantProductIds={variantProductIds}
              />
              <Pagination currentPage={currentPage} totalItems={visibleProducts.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
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
  const [products, setProducts] = useState<ProductListItem[]>([]);
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
        const [allCollections, memberResponse, catalogProducts] = await Promise.all([
          api.collections.list({ kind: "system", authenticated: true }),
          api.collections.getProducts(collectionId, { authenticated: true }),
          api.products.getProducts({ page: 1, page_size: 100, authenticated: true }),
        ]);

        if (cancelled) return;

        const collectionRow = ((allCollections || []) as Collection[]).find((c) => c.id === collectionId);
        if (!collectionRow) {
          setError("Collection not found");
          return;
        }

        const members = (memberResponse?.items || memberResponse || []) as Array<{ display_id: string }>;
        const memberIds = new Set(members.map((m) => String(m.display_id)));
        const memberProducts = (catalogProducts || []).filter((p) => memberIds.has(String(p.display_id)));

        setCollection(collectionRow);
        setProducts(memberProducts);
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
        products={products}
        scope="admin"
        actionsSidebar={<ProductActionsSidebar scope="admin" />}
      />
    </VariantSelectionProvider>
  );
}
