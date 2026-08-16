"use client";

import React, { useEffect, useRef, useState } from "react";
// Fetch shops from backend
import api from "@/lib/api";
import ShopProductsRibbon from "@/components/Ribbon/ShopProductsRibbon";
import FilterHeader from "@/components/FilterHeader/FilterHeader";
import Pagination from "@/components/Product/Pagination";
import type { PaginatedShopsResponse, ProductListItem, ShopStatusResponse } from "@/types/apiTypes";

const pendingShopsRequests = new Map<string, Promise<PaginatedShopsResponse>>();
const pendingShopProductsRequests = new Map<string, Promise<ProductListItem[]>>();

export default function ShopsPage() {
  const [sortBy, setSortBy] = useState<"newest" | "most-viewed" | "product-count">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleSortChange = (sort: "price-low" | "price-high" | "newest" | "most-viewed" | "product-count") => {
    if (sort === "newest" || sort === "most-viewed" || sort === "product-count") {
      setSortBy(sort);
      setCurrentPage(1);
    }
  };

  const [isHeaderSticky, setIsHeaderSticky] = useState(true);

  const [shops, setShops] = useState<ShopStatusResponse[]>([]);
  const [totalShops, setTotalShops] = useState(0);
  const [loading, setLoading] = useState(true);
  const [productsMap, setProductsMap] = useState<Record<string, ProductListItem[]>>({});

  useEffect(() => {
    setIsHeaderSticky(true);
  }, []);

  useEffect(() => {
    const requestKey = `${sortBy}:${currentPage}:${itemsPerPage}`;
    if (pendingShopsRequests.has(requestKey)) {
      return;
    }

    const requestPromise = (async () => {
      setLoading(true);
      setProductsMap({});
      try {
        const data = await api.shops.listPage({ sort_by: sortBy, view_count: true, page: currentPage, page_size: itemsPerPage });
        setShops(data.items || []);
        setTotalShops(data.total_count || 0);
        return data;
      } catch (e) {
        console.error("Failed to load shops", e);
        setShops([]);
        setTotalShops(0);
        return { items: [], page: currentPage, page_size: itemsPerPage, total_count: 0, has_next: false } as PaginatedShopsResponse;
      } finally {
        setLoading(false);
      }
    })();

    pendingShopsRequests.set(requestKey, requestPromise);
    requestPromise.finally(() => {
      pendingShopsRequests.delete(requestKey);
    });
  }, [sortBy, currentPage, itemsPerPage]);

  // When shops load, fetch a small set of products for each shop to display in the section
  React.useEffect(() => {
    if (!shops || shops.length === 0) return;

    let mounted = true;
    const loadProducts = async () => {
      try {
        const entries = await Promise.all(
          shops.map(async (shop) => {
            const productRequestKey = shop.display_id;
            const existingPromise = pendingShopProductsRequests.get(productRequestKey);
            const requestPromise = existingPromise ?? (async () => {
              try {
                return await api.products.getProducts({ shop_display_id: shop.display_id, page: 1, page_size: 20 });
              } catch (e) {
                console.error("Failed to load products for shop", shop.display_id, e);
                return [] as ProductListItem[];
              }
            })();

            if (!existingPromise) {
              pendingShopProductsRequests.set(productRequestKey, requestPromise);
            }

            const items = await requestPromise;
            return [shop.display_id, items] as const;
          }),
        );

        if (!mounted) return;

        const map: Record<string, ProductListItem[]> = {};
        for (const [key, items] of entries) {
          map[key] = items;
        }
        setProductsMap(map);
      } catch (e) {
        console.error("Failed to load shop products", e);
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, [shops]);

  // For now apply no advanced filters; just use the fetched shop list
  const filteredShops = shops;
    
  

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <section>
        <FilterHeader
          pageTitle="Shops"
          productCount={totalShops}
          showFiltersToggle={false}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          isSticky={isHeaderSticky}
          sortOptions={[
            { value: "newest", label: "Newest" },
            { value: "most-viewed", label: "Most Viewed" },
            { value: "product-count", label: "Most Products" },
          ]}
        />

        <div className="px-4 py-4">
          <section className="flex-1 min-w-0">
            {loading ? (
              <div className="py-12 text-center">
                <p className="text-slate-600">Loading shops…</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredShops.map((shop) => (
                  <ShopProductsRibbon
                    key={shop.display_id}
                    shop={shop}
                    products={productsMap?.[shop.display_id] || []}
                  />
                ))}
              </div>
            )}
            <Pagination currentPage={currentPage} totalItems={totalShops} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
          </section>
        </div>
      </section>

    </main>
  );
}
