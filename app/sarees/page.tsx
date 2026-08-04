"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
// mock data removed; products fetched via API and used as source of truth
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
  const itemsPerPage = 12;
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 25000],
    selectedAttributeOptionIds: {},
  });

  const [showFilters, setShowFilters] = useState(true);
  const [isHeaderSticky, setIsHeaderSticky] = useState(true);
  const sidebarRef = useRef<HTMLElement | null>(null);

  const [apiProducts, setApiProducts] = useState<ProductListItem[] | null>(null);
  const [filterAttributes, setFilterAttributes] = useState<ProductFilterAttribute[]>([]);
  const [collectionFilterIds, setCollectionFilterIds] = useState<Set<string> | null>(null);
  const [collectionFilterName, setCollectionFilterName] = useState<string | null>(null);

  const api = useApi();
  const DEBUG_FILTERS = true;

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

  // Fetch public products from API (unauthenticated)
  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      try {
        const products = await api.products.getProducts({ page: 1, page_size: 100, authenticated: false });
        const productsMissingAttributes = products
          .filter((product) => !product.attributes || product.attributes.length === 0)
          .map((product) => product.display_id);

        let hydratedProducts = products;

        if (productsMissingAttributes.length > 0) {
          const detailRows = await Promise.all(
            productsMissingAttributes.map(async (displayId) => {
              try {
                const detailResponse = await api.products.getProductDetails(displayId, { authenticated: false });
                return {
                  display_id: displayId,
                  attributes: (detailResponse.product.attributes || []).map((attr) => ({
                    definition_id: attr.definition_id,
                    option_id: attr.option_id,
                    option_value: attr.value,
                  })),
                };
              } catch {
                return { display_id: displayId, attributes: [] as Array<{ definition_id: number; option_id: number; option_value?: string }> };
              }
            })
          );

          const attrsByProductId = new Map(detailRows.map((row) => [row.display_id, row.attributes]));
          hydratedProducts = products.map((product) => {
            const hydratedAttrs = attrsByProductId.get(product.display_id);
            if (!hydratedAttrs) return product;
            return {
              ...product,
              attributes: hydratedAttrs,
            };
          });
        }

        if (mounted) setApiProducts(hydratedProducts);
      } catch (e) {
        // keep mockSarees as fallback on error
      }
    };

    fetchProducts();

    return () => {
      mounted = false;
    };
  }, []);

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

  useEffect(() => {
    let mounted = true;

    const hydrateCollectionFilter = async () => {
      if (!collectionIdParam) {
        if (mounted) {
          setCollectionFilterIds(null);
          setCollectionFilterName(null);
        }
        return;
      }

      const numericId = Number(collectionIdParam);
      if (!Number.isFinite(numericId)) {
        if (mounted) {
          setCollectionFilterIds(null);
          setCollectionFilterName(null);
        }
        return;
      }

      try {
        const [membersResponse, allCollections] = await Promise.all([
          api.collections.getProducts(numericId, { authenticated: false }),
          api.collections.list({ authenticated: false }),
        ]);

        const memberRows = (membersResponse?.items || membersResponse || []) as Array<{ display_id: string }>;
        const ids = new Set(memberRows.map((item) => String(item.display_id)));
        const collectionName = (allCollections || []).find((c: any) => Number(c.id) === numericId)?.name || null;

        if (mounted) {
          setCollectionFilterIds(ids);
          setCollectionFilterName(collectionName);
        }
      } catch {
        if (mounted) {
          setCollectionFilterIds(null);
          setCollectionFilterName(null);
        }
      }
    };

    hydrateCollectionFilter();

    return () => {
      mounted = false;
    };
  }, [api, collectionIdParam]);

  // Filter sarees based on selected filters
  const displayProducts = apiProducts ?? [];

  const filteredSarees = displayProducts.filter((saree) => {
    const priceMatch =
      saree.price >= filters.priceRange[0] &&
      saree.price <= filters.priceRange[1];

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

      const productAttrs = saree.attributes || [];
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

    const collectionMatch = collectionFilterIds ? collectionFilterIds.has(String(saree.display_id)) : true;

    return priceMatch && attributeMatch && collectionMatch;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, collectionFilterIds]);

  const paginationOffset = (currentPage - 1) * itemsPerPage;
  const paginatedSarees = filteredSarees.slice(paginationOffset, paginationOffset + itemsPerPage);

  useEffect(() => {
    if (!DEBUG_FILTERS || !apiProducts) return;
    console.log("[Sarees][Products] Received ProductListItem payload", {
      count: apiProducts.length,
      sample: apiProducts.slice(0, 10).map((p) => ({
        display_id: p.display_id,
        price: p.price,
        attributes: p.attributes ?? [],
      })),
    });
  }, [apiProducts]);

  useEffect(() => {
    if (!DEBUG_FILTERS) return;
    console.log("[Sarees][FilterAttributes] Active attributes rendered in sidebar", {
      count: filterAttributes.length,
      attributes: filterAttributes.map((attr) => ({
        id: attr.id,
        name: attr.name,
        options: attr.options.map((opt) => ({ id: opt.id, value: opt.value })),
      })),
    });
  }, [filterAttributes]);

  useEffect(() => {
    if (!DEBUG_FILTERS) return;

    const selectedByAttribute = Object.entries(filters.selectedAttributeOptionIds).filter(([, ids]) => ids.length > 0);
    const debugRows = displayProducts.map((product) => {
      const productAttrs = product.attributes || [];

      const perAttributeChecks = selectedByAttribute.map(([attrId, selectedOptionIds]) => {
        const numericAttrId = Number(attrId);
        const selectedAttribute = filterAttributes.find((attr) => Number(attr.id) === numericAttrId);
        const selectedOptionValues = (selectedAttribute?.options || [])
          .filter((opt) => (selectedOptionIds as Array<number | string>).some((selectedId) => Number(selectedId) === Number(opt.id)))
          .map((opt) => String(opt.value).trim().toLowerCase());

        const scopedAttrs = productAttrs.filter((attr) => Number(attr.definition_id) === numericAttrId);
        const productOptionIdsForAttr = scopedAttrs
          .map((attr) => Number(attr.option_id))
          .filter((id) => Number.isFinite(id));
        const productOptionValuesForAttr = scopedAttrs
          .map((attr) => String(attr.option_value || "").trim().toLowerCase())
          .filter((value) => value.length > 0);

        const normalizedSelectedIds = (selectedOptionIds as Array<number | string>)
          .map((selectedId) => Number(selectedId))
          .filter((id) => Number.isFinite(id));

        const matchedById = normalizedSelectedIds.some((id) => productOptionIdsForAttr.includes(id));
        const matchedByValue = selectedOptionValues.some((value) => productOptionValuesForAttr.includes(value));
        const matched = matchedById || matchedByValue;

        return {
          attributeId: numericAttrId,
          selectedOptionIds: normalizedSelectedIds,
          selectedOptionValues,
          productOptionIdsForAttr,
          productOptionValuesForAttr,
          matchedById,
          matchedByValue,
          matched,
        };
      });

      const priceMatch = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];
      const attributeMatch = perAttributeChecks.every((check) => check.matched);

      return {
        display_id: product.display_id,
        price: product.price,
        priceMatch,
        attributeMatch,
        includedAfterFilter: priceMatch && attributeMatch,
        rawAttributes: productAttrs,
        perAttributeChecks,
      };
    });

    console.log("[Sarees][FilterState] Selected filters", {
      priceRange: filters.priceRange,
      selectedAttributeOptionIds: filters.selectedAttributeOptionIds,
      selectedAttributesCount: selectedByAttribute.length,
    });
    console.log("[Sarees][FilterResult] Per-product comparison", debugRows);
  }, [filters, displayProducts, filterAttributes]);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Products section: sticky header and filters release at section end */}
      <section>
        <FilterHeader
          pageTitle={collectionFilterName ? `Sarees - ${collectionFilterName}` : "Sarees"}
          productCount={filteredSarees.length}
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
                <SareesFilter
                  attributes={filterAttributes}
                  onFilterChange={setFilters}
                />
              </aside>
            )}

            {/* Right Column - Product grid */}
            <section className="flex-1 min-w-0">
              <SelectionToolbar visibleIds={paginatedSarees.map((p) => p.display_id)} scope="public" />
              <ProductGrid products={paginatedSarees} showCheckboxes={true} scope="public" />
              <Pagination currentPage={currentPage} totalItems={filteredSarees.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
            </section>
          </div>
        </div>
      </section>

      <div className="px-4 pb-8">
        {/* Sample end content for sticky behavior testing */}
        <section className="mt-16 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Sample Footer Content
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            This is temporary placeholder content to validate that the filter header
            and filters section move up once the products area ends.
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Replace this block later with links, copyright text, newsletter signup,
            policy links, or any other end-of-page content.
            Replace this block later with links, copyright text, newsletter signup,
            policy links, or any other end-of-page content.
            Replace this block later with links, copyright text, newsletter signup,
            policy links, or any other end-of-page content.
            Replace this block later with links, copyright text, newsletter signup,
            policy links, or any other end-of-page content.
            Replace this block later with links, copyright text, newsletter signup,
            policy links, or any other end-of-page content.
            Replace this block later with links, copyright text, newsletter signup,
            policy links, or any other end-of-page content.
            Replace this block later with links, copyright text, newsletter signup,
            policy links, or any other end-of-page content.
            Replace this block later with links, copyright text, newsletter signup,
            policy links, or any other end-of-page content.
            Replace this block later with links, copyright text, newsletter signup,
            policy links, or any other end-of-page content.
            Replace this block later with links, copyright text, newsletter signup,
            policy links, or any other end-of-page content.
            Replace this block later with links, copyright text, newsletter signup,
            policy links, or any other end-of-page content.
            Replace this block later with links, copyright text, newsletter signup,
            policy links, or any other end-of-page content.
          </p>
        </section>
      </div>
    </main>
  );
}
