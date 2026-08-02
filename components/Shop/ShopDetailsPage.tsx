"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import BackendImage from "@/components/BackendImage/BackendImage";
import FilterHeader from "@/components/FilterHeader/FilterHeader";
import ProductGrid from "@/components/Product/ProductGrid";
import SelectionToolbar from "@/components/Product/SelectionToolbar";
import SareesFilter, { FilterState } from "@/components/Filters/SareesFilter";
import type { ProductFilterAttribute, ProductListItem, ShopDetail } from "@/types/apiTypes";
import { useProductActions } from "@/lib/productActions";
import { useApi } from "@/lib/ApiProvider";

type ShopDetailsPageProps = {
  shop: ShopDetail;
  products: ProductListItem[];
  scope?: string;
};

export default function ShopDetailsPage({ shop, products, scope }: ShopDetailsPageProps) {
  const [displayProducts, setDisplayProducts] = useState<ProductListItem[]>(products);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 25000],
    selectedAttributeOptionIds: {},
  });

  const [showFilters, setShowFilters] = useState(true);
  const [isHeaderSticky, setIsHeaderSticky] = useState(true);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const [filterAttributes, setFilterAttributes] = useState<ProductFilterAttribute[]>([]);

  const api = useApi();

  const filteredProducts = useMemo(
    () =>
      displayProducts.filter((product) => {
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
    [displayProducts, filters, filterAttributes]
  );

  const { actionViewIds, setAllProducts } = useProductActions();

  const visibleProducts = actionViewIds ? filteredProducts.filter((p) => actionViewIds.includes(String(p.display_id))) : filteredProducts;

  // keep provider aware of current products
  useEffect(() => {
    setAllProducts(filteredProducts);
  }, [filteredProducts, setAllProducts]);


  useEffect(() => {
    let mounted = true;

    const hydrateMissingAttributes = async () => {
      const productsMissingAttributes = products
        .filter((product) => !product.attributes || product.attributes.length === 0)
        .map((product) => product.display_id);

      if (productsMissingAttributes.length === 0) {
        if (mounted) setDisplayProducts(products);
        return;
      }

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
      const hydratedProducts = products.map((product) => {
        const hydratedAttrs = attrsByProductId.get(product.display_id);
        if (!hydratedAttrs) return product;
        return {
          ...product,
          attributes: hydratedAttrs,
        };
      });

      if (mounted) setDisplayProducts(hydratedProducts);
    };

    hydrateMissingAttributes();

    return () => {
      mounted = false;
    };
  }, [api, products]);

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

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <section className="px-4 pt-4 pb-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white via-rose-50/40 to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="relative w-28 h-28 lg:w-36 lg:h-36 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-sm bg-white dark:bg-gray-800 shrink-0">
              {shop.shop_logo_url ? (
                <BackendImage src={shop.shop_logo_url} alt={shop.name} fill style={{ objectFit: "cover" }} priority />
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-gray-800" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs tracking-[0.2em] uppercase text-rose-600 dark:text-rose-400 font-semibold">
                Artisan Partner
              </p>
              <h1 className="mt-1 text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {shop.name}
              </h1>
              <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-7 max-w-3xl">
                {shop.description || "No description available."}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  <span className="font-semibold text-gray-900 dark:text-white">Established:</span> {shop.year_established}
                </p>
                <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                <p>
                  <span className="font-semibold text-gray-900 dark:text-white">Contact:</span> {shop.phone_number}
                </p>
                <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                <p>
                  <span className="font-semibold text-gray-900 dark:text-white">Email:</span> {shop.email}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-rose-600">
                <a href="#" className="hover:underline font-medium">Instagram</a>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <a href="#" className="hover:underline font-medium">Facebook</a>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <a href="#" className="hover:underline font-medium">YouTube</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <FilterHeader
          pageTitle={shop.name}
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
                <SareesFilter
                  attributes={filterAttributes}
                  onFilterChange={setFilters}
                />
              </aside>
            )}

            <section className="flex-1 min-w-0">
              <SelectionToolbar visibleIds={visibleProducts.map((p) => p.display_id)} scope={scope ?? "public"} />
              <ProductGrid products={visibleProducts} hideShop={true} showCheckboxes={true} scope={scope ?? "public"} />
            </section>
            {/* ProductActionsSidebar is rendered at the page level for vendor/admin contexts */}
          </div>
        </div>
      </section>
    </main>
  );
}
