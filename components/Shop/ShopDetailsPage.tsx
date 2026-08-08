"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import BackendImage from "@/components/BackendImage/BackendImage";
import FilterHeader from "@/components/FilterHeader/FilterHeader";
import Product from "@/components/Product/Product";
import ProductActionsSidebar from "@/components/Product/ProductActionsSidebar";
import ProductGrid from "@/components/Product/ProductGrid";
import AnnouncementsRibbon from "@/components/Ribbon/AnnouncementsRibbon";
import Ribbon from "@/components/Ribbon/Ribbon";
import SelectionToolbar from "@/components/Product/SelectionToolbar";
import SareesFilter, { FilterState } from "@/components/Filters/SareesFilter";
import Pagination from "@/components/Product/Pagination";
import type { AnnouncementBanner, ProductFilterAttribute, ProductListItem, ShopDetail } from "@/types/apiTypes";
import { useProductActions } from "@/lib/productActions";
import { useApi } from "@/lib/ApiProvider";
import { useVariantSelection } from "@/lib/VariantSelectionContext";

type ShopCollectionItem = {
  id: number;
  source: "shop" | "system";
  display_id?: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
};

type CollectionMemberItem = ProductListItem & { id: string };

type ShopDetailsPageProps = {
  shop: ShopDetail;
  products: ProductListItem[];
  scope?: string;
  actionsSidebar?: React.ReactNode;
};

const shopCollectionsCache = new Map<string, { collections: ShopCollectionItem[]; collectionMembers: Record<string, CollectionMemberItem[]> }>();
const shopCollectionsPromise = new Map<string, Promise<{ collections: ShopCollectionItem[]; collectionMembers: Record<string, CollectionMemberItem[]> }>>();
const shopAnnouncementsCache = new Map<string, AnnouncementBanner[]>();
const shopAnnouncementsPromise = new Map<string, Promise<AnnouncementBanner[]>>();
let filterAttributesCache: ProductFilterAttribute[] | null = null;
let filterAttributesPromise: Promise<ProductFilterAttribute[]> | null = null;

async function fetchShopCollections(api: ReturnType<typeof useApi>, shopId: string, isManagedScope: boolean, sortBy: "newest" | "most-viewed") {
  const cacheKey = `${shopId}:${isManagedScope ? "managed" : "public"}:${sortBy}`;

  if (shopCollectionsCache.has(cacheKey)) {
    return shopCollectionsCache.get(cacheKey)!;
  }

  if (shopCollectionsPromise.has(cacheKey)) {
    return await shopCollectionsPromise.get(cacheKey)!;
  }

  const promise = (async () => {
    const shopCollectionRows = await api.collections.list({
      kind: "shop",
      shop_display_id: shopId,
      authenticated: isManagedScope,
      sort_by: sortBy,
      view_count: true,
    });

    const systemCollectionRows = await api.collections.list({
      kind: "system",
      authenticated: isManagedScope,
      sort_by: sortBy,
      view_count: true,
    });

    const normalizedShopCollections: ShopCollectionItem[] = ((shopCollectionRows || []) as Array<Omit<ShopCollectionItem, "source">>)
      .map((item) => ({ ...item, source: "shop" as const }));
    const normalizedSystemCollections: ShopCollectionItem[] = ((systemCollectionRows || []) as Array<Omit<ShopCollectionItem, "source">>)
      .map((item) => ({ ...item, source: "system" as const }));

    const memberEntries = await Promise.all(
      [...normalizedShopCollections, ...normalizedSystemCollections].map(async (collectionItem) => {
        const collectionKey = `${collectionItem.source}:${collectionItem.id}`;
        try {
          const pageData = await api.collections.getProductsPage(collectionItem.id, {
            authenticated: isManagedScope,
            page: 1,
            page_size: 100,
            shop_display_id: collectionItem.source === "system" ? shopId : undefined,
          });
          const items = (pageData?.items || []) as ProductListItem[];
          const normalizedItems = items.map((it) => ({
            ...it,
            id: `${collectionItem.source}-${collectionItem.id}-${it.display_id}`,
          } as CollectionMemberItem));
          return [collectionItem, collectionKey, normalizedItems] as const;
        } catch (err) {
          console.warn(`[ShopDetailsPage] Failed to load collection ${collectionItem.id} products:`, err);
          return [collectionItem, collectionKey, [] as CollectionMemberItem[]] as const;
        }
      })
    );

    const memberMap: Record<string, CollectionMemberItem[]> = {};
    const validCollections: ShopCollectionItem[] = [];

    memberEntries.forEach(([collectionItem, key, items]) => {
      memberMap[key] = items;
      if (collectionItem.source === "shop" || items.length > 0) {
        validCollections.push(collectionItem);
      }
    });

    return { collections: validCollections, collectionMembers: memberMap };
  })();

  shopCollectionsPromise.set(cacheKey, promise);

  try {
    const value = await promise;
    shopCollectionsCache.set(cacheKey, value);
    return value;
  } finally {
    shopCollectionsPromise.delete(cacheKey);
  }
}

async function fetchShopAnnouncements(api: ReturnType<typeof useApi>, shopId: string) {
  if (shopAnnouncementsCache.has(shopId)) {
    return shopAnnouncementsCache.get(shopId)!;
  }

  if (shopAnnouncementsPromise.has(shopId)) {
    return await shopAnnouncementsPromise.get(shopId)!;
  }

  const promise = api.announcements.list({ shop_display_id: shopId });
  shopAnnouncementsPromise.set(shopId, promise);

  try {
    const rows = await promise;
    shopAnnouncementsCache.set(shopId, rows);
    return rows;
  } finally {
    shopAnnouncementsPromise.delete(shopId);
  }
}

async function fetchFilterAttributes(api: ReturnType<typeof useApi>) {
  if (filterAttributesCache) {
    return filterAttributesCache;
  }

  if (filterAttributesPromise) {
    return await filterAttributesPromise;
  }

  const promise = api.products.getFilterAttributes();
  filterAttributesPromise = promise;

  try {
    const attrs = await promise;
    filterAttributesCache = attrs;
    return attrs;
  } finally {
    filterAttributesPromise = null;
  }
}

export default function ShopDetailsPage({ shop, products, scope, actionsSidebar }: ShopDetailsPageProps) {
  const [displayProducts, setDisplayProducts] = useState<ProductListItem[]>(products);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "collections" | "about">("overview");
  const [selectedCollectionKey, setSelectedCollectionKey] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 25000],
    selectedAttributeOptionIds: {},
  });
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "newest" | "most-viewed">("newest");
  const [showFilters, setShowFilters] = useState(true);
  const [isHeaderSticky, setIsHeaderSticky] = useState(true);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const productsSectionRef = useRef<HTMLElement | null>(null);
  const [filterAttributes, setFilterAttributes] = useState<ProductFilterAttribute[]>([]);
  const [collections, setCollections] = useState<ShopCollectionItem[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [collectionMembers, setCollectionMembers] = useState<Record<string, CollectionMemberItem[]>>({});
  const [shopAnnouncements, setShopAnnouncements] = useState<AnnouncementBanner[]>([]);
  const [serverProducts, setServerProducts] = useState<ProductListItem[]>([]);
  const [serverTotalProducts, setServerTotalProducts] = useState(0);
  const [serverLoadingProducts, setServerLoadingProducts] = useState(false);
  const [serverProductsError, setServerProductsError] = useState("");

  const { isVariantMode, mainProductId, variantProductIds } = useVariantSelection();
  const api = useApi();
  const isManagedScope = !!scope && scope !== "public";

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

  const selectedCollectionMemberIds = useMemo(() => {
    if (!selectedCollectionKey) return null;
    const members = collectionMembers[selectedCollectionKey] || [];
    return new Set(members.map((m) => String(m.display_id)));
  }, [selectedCollectionKey, collectionMembers]);

  const collectionScopedProducts = useMemo(() => {
    if (!selectedCollectionMemberIds) return filteredProducts;
    return filteredProducts.filter((p) => selectedCollectionMemberIds.has(String(p.display_id)));
  }, [filteredProducts, selectedCollectionMemberIds]);

  const { actionViewIds, actionCollectionQuery, setAllProducts } = useProductActions();
  const selectedAttributeOptionIds = useMemo(
    () =>
      Object.values(filters.selectedAttributeOptionIds)
        .flat()
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id)),
    [filters]
  );

  const shouldUseServerProducts = activeTab === "products";

  useEffect(() => {
    if (!shouldUseServerProducts) return;

    let cancelled = false;

    const loadServerProducts = async () => {
      setServerLoadingProducts(true);
      setServerProductsError("");

      try {
        const baseParams = {
          authenticated: true,
          page: currentPage,
          page_size: itemsPerPage,
          min_price: filters.priceRange[0],
          max_price: filters.priceRange[1],
          sort_by: sortBy,
          attribute_option_ids: selectedAttributeOptionIds,
        } as const;

        let pageData;
        if (actionCollectionQuery) {
          pageData = await api.collections.getProductsPage(actionCollectionQuery.collectionId, {
            ...baseParams,
            mode: actionCollectionQuery.mode,
            source_shop_display_id: actionCollectionQuery.mode !== "view" ? shop.display_id : undefined,
            track_view: actionCollectionQuery.mode === "view",
          });
        } else if (selectedCollectionKey) {
          const [source, collectionIdValue] = selectedCollectionKey.split(":");
          const selectedCollectionId = Number(collectionIdValue);
          pageData = await api.collections.getProductsPage(selectedCollectionId, {
            ...baseParams,
            mode: "view",
            shop_display_id: source === "system" ? shop.display_id : undefined,
            track_view: true,
          });
        } else {
          pageData = await api.products.getProductsPage({
            ...baseParams,
            shop_display_id: shop.display_id,
          });
        }

        if (cancelled) return;
        let items = pageData.items || [];
        if (scope?.startsWith("vendor:") && selectedCollectionKey && !actionCollectionQuery) {
          items = items.filter((item) => String(item.shop_display_id) === String(shop.display_id));
        }
        setServerProducts(items);
        setServerTotalProducts(pageData.total_count || 0);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load products";
        setServerProductsError(msg);
        setServerProducts([]);
        setServerTotalProducts(0);
      } finally {
        if (!cancelled) setServerLoadingProducts(false);
      }
    };

    loadServerProducts();

    return () => {
      cancelled = true;
    };
  }, [
    shouldUseServerProducts,
    api,
    currentPage,
    itemsPerPage,
    filters,
    selectedAttributeOptionIds,
    sortBy,
    actionCollectionQuery,
    selectedCollectionKey,
    scope,
    shop.display_id,
  ]);

  const visibleProducts = useMemo(() => {
    if (shouldUseServerProducts) return serverProducts;
    if (actionViewIds) {
      return collectionScopedProducts.filter((p) => actionViewIds.includes(String(p.display_id)));
    }
    return collectionScopedProducts;
  }, [shouldUseServerProducts, serverProducts, actionViewIds, collectionScopedProducts]);

  // keep provider aware of current products
  useEffect(() => {
    setAllProducts(shouldUseServerProducts ? visibleProducts : filteredProducts);
  }, [filteredProducts, shouldUseServerProducts, visibleProducts, setAllProducts]);

  // Reset to page 1 when filters, sort order, or collection changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, selectedCollectionKey, actionCollectionQuery]);

  // Clear selected collection filter, sort, and filters whenever switching away from the products tab.
  useEffect(() => {
    if (activeTab !== "products") {
      setSelectedCollectionKey(null);
      setSortBy("newest");
      setFilters({
        priceRange: [0, 25000],
        selectedAttributeOptionIds: {},
      });
      setShowFilters(true);
    }
  }, [activeTab]);

  const paginationOffset = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = shouldUseServerProducts
    ? visibleProducts
    : visibleProducts.slice(paginationOffset, paginationOffset + itemsPerPage);


  useEffect(() => {
    setDisplayProducts(products);
    return () => {
      // no cleanup required
    };
  }, [products]);

  useEffect(() => {
    let mounted = true;

    const loadCollectionsAndMembers = async () => {
      setLoadingCollections(true);
      try {
        const { collections: validCollections, collectionMembers: memberMap } = await fetchShopCollections(
          api,
          shop.display_id,
          isManagedScope,
          sortBy
        );

        if (!mounted) return;
        setCollections(validCollections);
        setCollectionMembers(memberMap);
      } catch (err) {
        console.warn("[ShopDetailsPage] Failed to load shop collections:", err);
        if (!mounted) return;
        setCollections([]);
        setCollectionMembers({});
      } finally {
        if (mounted) setLoadingCollections(false);
      }
    };

    loadCollectionsAndMembers();

    return () => {
      mounted = false;
    };
  }, [api, shop.display_id, isManagedScope, sortBy]);

  useEffect(() => {
    let mounted = true;

    const loadAnnouncements = async () => {
      try {
        const rows = await fetchShopAnnouncements(api, shop.display_id);
        if (mounted) setShopAnnouncements(rows || []);
      } catch (err) {
        console.warn("[ShopDetailsPage] Failed to load announcements:", err);
        if (mounted) setShopAnnouncements([]);
      }
    };

    loadAnnouncements();

    return () => {
      mounted = false;
    };
  }, [api, shop.display_id]);

  useEffect(() => {
    let mounted = true;

    const loadFilterAttributes = async () => {
      try {
        const attrs = await fetchFilterAttributes(api);
        if (mounted) setFilterAttributes(attrs);
      } catch (err) {
        console.warn("[ShopDetailsPage] Failed to load filter attributes:", err);
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

  const tabButtons: Array<{ key: "overview" | "products" | "collections" | "about"; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "products", label: "Products" },
    { key: "collections", label: "Collections" },
    { key: "about", label: "About" },
  ];

  const homeBannerItems = useMemo(() => shopAnnouncements, [shopAnnouncements]);

  const collectionRibbonRows = useMemo(() => {
    return collections.map((collectionItem) => {
      const collectionKey = `${collectionItem.source}:${collectionItem.id}`;
      const members = collectionMembers[collectionKey] || [];

      return {
        collection: collectionItem,
        key: collectionKey,
        items: members,
      };
    });
  }, [collections, collectionMembers]);

  const topCollectionRibbonRows = useMemo(() => {
    const systemRows = collectionRibbonRows.filter((row) => row.collection.source === "system");
    const shopRows = collectionRibbonRows.filter((row) => row.collection.source === "shop");

    const selectedRows = [
      ...systemRows.slice(0, 1),
      ...shopRows.slice(0, 2),
    ];

    if (selectedRows.length < 3) {
      const fallbackRows = collectionRibbonRows.filter(
        (row) => !selectedRows.some((selected) => selected.key === row.key)
      );
      selectedRows.push(...fallbackRows.slice(0, 3 - selectedRows.length));
    }

    return selectedRows;
  }, [collectionRibbonRows]);

  const latestTwentyProducts = useMemo(() => {
    return displayProducts
      .filter((product) => {
        if (scope === "public") {
          return product.is_active && product.stock_quantity > 0;
        }
        return true;
      })
      .sort((a, b) => {
        const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
        const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 20);
  }, [displayProducts, scope]);

  const aboutRows = [
    { label: "Established", value: String(shop.year_established || "-") },
    { label: "City", value: shop.city || "-" },
    { label: "Address", value: shop.address || "-" },
    { label: "Contact", value: shop.phone_number || "-" },
    { label: "Email", value: shop.email || "-" },
  ];

  const socialLinks = [
    { label: "Website", url: shop.website_url },
    { label: "Instagram", url: shop.instagram_url },
    { label: "Facebook", url: shop.facebook_url },
    { label: "YouTube", url: shop.youtube_url },
  ].filter((item) => !!item.url);

  const showSelectionTools = isManagedScope;
  const resolvedActionsSidebar = actionsSidebar ?? <ProductActionsSidebar scope={scope ?? "public"} />;

  const selectedCollectionName = useMemo(() => {
    if (!selectedCollectionKey) return null;
    const [source, id] = selectedCollectionKey.split(":");
    return collections.find((c) => c.source === source && String(c.id) === id)?.name || null;
  }, [selectedCollectionKey, collections]);

  const openCollectionProducts = (collectionKey: string) => {
    setSelectedCollectionKey(collectionKey);
    setActiveTab("products");
  };

  const openProductsTab = () => {
    setSelectedCollectionKey(null);
    setActiveTab("products");
  };

  const openOverviewTab = () => {
    setSelectedCollectionKey(null);
    setActiveTab("overview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <section className="px-4 pb-0">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white via-rose-50/40 to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 p-4 lg:p-5">
          <div className="mx-auto w-full flex flex-col gap-4">
            <div className="w-full flex items-start gap-4">
              <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-sm bg-white dark:bg-gray-800 flex-shrink-0">
                {shop.shop_logo_url ? (
                  <BackendImage src={shop.shop_logo_url} alt={shop.name} fill style={{ objectFit: "cover" }} priority />
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-800" />
                )}
              </div>

              <div className="flex-1 text-center">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{shop.name}</h1>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 leading-6 max-w-2xl mx-auto whitespace-normal break-words">
                  {shop.description || "No description available."}
                </p>

                <div className="mt-3 text-center text-sm text-gray-700 dark:text-gray-300">
                  <span className="mx-1">
                    <span className="font-semibold text-gray-900 dark:text-white">Established:</span> {shop.year_established || "-"}
                  </span>
                  <span className="mx-1">
                    <span className="font-semibold text-gray-900 dark:text-white">City:</span> {shop.city || "-"}
                  </span>
                  <span className="mx-1">
                    <span className="font-semibold text-gray-900 dark:text-white">Contact:</span> {shop.phone_number || "-"}
                  </span>

                  {socialLinks.length > 0 ? (
                    <div className="mt-1 text-rose-600">
                      {socialLinks.map((link, index) => (
                        <React.Fragment key={link.label}>
                          <a href={link.url!} target="_blank" rel="noreferrer" className="hover:underline font-medium mx-1">
                            {link.label}
                          </a>
                          {index < socialLinks.length - 1 ? <span className="text-gray-300 dark:text-gray-600">|</span> : null}
                        </React.Fragment>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            
          </div>
        </div>
      </section>

      <section className="px-4 pb-3">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <nav className="bg-rose-600 text-white py-1">
            <div className="mx-auto flex max-w-6xl items-center justify-center gap-6">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {tabButtons.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-1 rounded transition-colors ${
                        isActive
                          ? "bg-white text-rose-600"
                          : "text-white hover:bg-rose-500"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      </section>

      {activeTab === "overview" ? (
        <section>
          <div className="px-4 pb-2">
            <div className="mx-auto">
              <AnnouncementsRibbon
                items={homeBannerItems}
                onItemClick={(item) => {
                  if (!item.collection_id) return;
                  const matched = collectionRibbonRows.find((row) => row.collection.id === item.collection_id);
                  if (!matched) return;
                  openCollectionProducts(matched.key);
                }}
              />
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="mx-auto">
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Collections</h2>
              <div className="space-y-4">
                {topCollectionRibbonRows.map((row) => (
                  <div key={`overview-${row.collection.id}`}>
                    <Ribbon
                      title={row.collection.name}
                      action={
                        <button
                          type="button"
                          onClick={() => openCollectionProducts(row.key)}
                          className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-slate-100"
                        >
                          View all
                        </button>
                      }
                      items={row.items}
                      renderItem={(product: ProductListItem & { id: string }) => (
                        <div className="min-w-[12.5rem]">
                        <Product product={product} size="default" hideShop={true} />
                        </div>
                      )}
                      className="!mx-0 !rounded-3xl !border !border-slate-200 !shadow-sm !py-6 !px-6"
                    />
                    {row.items.length === 0 ? (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No products yet in this collection.</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 pb-8">
            <section className="rounded-3xl border border-slate-200 bg-rose-50 p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Latest Products</h2>
                  <p className="mt-1 text-sm text-slate-600">Newest arrivals from this shop.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={openProductsTab}
                    className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-slate-100"
                  >
                    View all
                  </button>
                </div>
              </div>
              <ProductGrid
                products={latestTwentyProducts}
                hideShop={true}
                showCheckboxes={false}
                scope="public"
                variantMode={false}
              />
            </section>
          </div>
        </section>
      ) : null}

      {activeTab === "collections" ? (
        <section className="px-4 pb-8">
          <div className="mx-auto">
            <FilterHeader
              pageTitle="Collections"
              productCount={collectionRibbonRows.length}
              showFiltersToggle={false}
              sortBy={sortBy}
              onSortChange={setSortBy}
              sortOptions={[
                { value: "newest", label: "Newest" },
                { value: "most-viewed", label: "Most Viewed" },
              ]}
              isSticky={false}
            />
            {loadingCollections ? <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Loading collections...</p> : null}
            {!loadingCollections && collectionRibbonRows.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">No collections available for this shop.</p>
            ) : null}

            <div className="mt-4 space-y-4">
              {collectionRibbonRows.map((row) => (
                <div key={row.collection.id}>
                  <Ribbon
                    title={row.collection.name}
                    action={
                      <button
                        type="button"
                        onClick={() => openCollectionProducts(row.key)}
                        className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-slate-100"
                      >
                        View all
                      </button>
                    }
                    items={row.items}
                    renderItem={(product: ProductListItem & { id: string }) => (
                      <div className="min-w-[12.5rem]">
                        <Product product={product} size="default" hideShop={true} />
                      </div>
                    )}
                    className="!mx-0 !rounded-3xl !border !border-slate-200 !shadow-sm !py-6 !px-6"
                  />
                  {row.items.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No products yet in this collection.</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "about" ? (
        <section className="px-4 pb-8">
          <div className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">About {shop.name}</h2>
            <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">{shop.description || "No description available."}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {aboutRows.map((row) => (
                <div key={row.label} className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{row.label}</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{row.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-gray-200 px-3 py-3 dark:border-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-500">Social Media</p>
              {socialLinks.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-3">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url!}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-rose-600 hover:underline"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No social media links available.</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "products" ? (
        <section>
          {selectedCollectionName ? (
            <div className="px-4 pb-2">
              <div className="mx-auto flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-900/50 dark:bg-rose-950/20">
                <p className="text-sm text-rose-800 dark:text-rose-200">
                  Viewing collection: <span className="font-semibold">{selectedCollectionName}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedCollectionKey(null)}
                  className="text-xs font-medium text-rose-700 hover:underline dark:text-rose-300"
                >
                  Clear filter
                </button>
              </div>
            </div>
          ) : null}

          <section ref={productsSectionRef}>
            <FilterHeader
              pageTitle={selectedCollectionName ? selectedCollectionName : shop.name}
              productCount={shouldUseServerProducts ? serverTotalProducts : visibleProducts.length}
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
                      onFilterChange={setFilters}
                    />
                  </aside>
                )}

                <section className="flex-1 min-w-0">
                  {showSelectionTools ? (
                    <SelectionToolbar visibleIds={paginatedProducts.map((p) => p.display_id)} scope={scope ?? "public"} />
                  ) : null}
                  <ProductGrid
                    products={paginatedProducts}
                    hideShop={true}
                    showCheckboxes={showSelectionTools}
                    scope={scope ?? "public"}
                    variantMode={isVariantMode}
                    mainProductId={mainProductId ?? undefined}
                    variantProductIds={variantProductIds}
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalItems={shouldUseServerProducts ? serverTotalProducts : visibleProducts.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                  {shouldUseServerProducts && serverLoadingProducts ? (
                    <p className="mt-3 text-sm text-slate-600">Loading products...</p>
                  ) : null}
                  {shouldUseServerProducts && serverProductsError ? (
                    <p className="mt-3 text-sm text-rose-600">{serverProductsError}</p>
                  ) : null}
                </section>

                {showSelectionTools ? resolvedActionsSidebar : null}
              </div>
            </div>
          </section>
        </section>
      ) : null}
    </main>
  );
}
