"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductGrid from "@/components/Product/ProductGrid";
import ShopRibbon from "@/components/Ribbon/ShopRibbon";
import Ribbon from "@/components/Ribbon/Ribbon";
import AnnouncementsRibbon from "@/components/Ribbon/AnnouncementsRibbon";
import Product from "@/components/Product/Product";
import api from "@/lib/api";
import type { AnnouncementBanner, Collection, ProductListItem, ShopStatusResponse } from "@/types/apiTypes";

type HomeShopItem = {
  display_id: string;
  name: string;
  shop_logo_url: string;
};

type HomepageRibbonRow = {
  collection: Collection;
  items: ProductListItem[];
};

export default function Home() {
  const router = useRouter();
  const [shops, setShops] = useState<HomeShopItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementBanner[]>([]);
  const [homepageRibbonRows, setHomepageRibbonRows] = useState<HomepageRibbonRow[]>([]);
  const [latestProducts, setLatestProducts] = useState<ProductListItem[]>([]);

  const handleAnnouncementClick = (item: AnnouncementBanner) => {
    const target = item.target ?? "/";
    try {
      const url = new URL(target, window.location.origin);
      if (url.pathname === "/sarees" && item.title) {
        url.searchParams.set("announcement_title", item.title);
      }
      router.push(`${url.pathname}${url.search}${url.hash}`);
    } catch (error) {
      router.push(target);
    }
  };

  async function loadHomepageCollections() {
    try {
      const collections = (await api.collections.list({ kind: "system", display_on_homepage: true, authenticated: false })) as Collection[];
      const rows = await Promise.all(
        collections.map(async (collection) => {
          try {
            const pageData = await api.collections.getProductsPage(collection.id, {
              authenticated: false,
              page: 1,
              page_size: 12,
            });
            return {
              collection,
              items: (pageData.items || []).filter((item) => item.is_active !== false),
            };
          } catch (error) {
            console.error("Failed to load products for collection", collection.id, error);
            return { collection, items: [] };
          }
        })
      );
      setHomepageRibbonRows(rows || []);
    } catch (error) {
      console.error("Failed to load homepage collections", error);
      setHomepageRibbonRows([]);
    }
  }

  useEffect(() => {
    let mounted = true;

    const trackHomepageVisit = async () => {
      try {
        await api.analytics.trackHomepageVisit();
      } catch (error) {
        console.error("Failed to track homepage visit", error);
      }
    };

    const loadShops = async () => {
      try {
        const rows = await api.shops.list();
        if (!mounted) return;
        setShops(
          rows.map((shop: ShopStatusResponse) => ({
            display_id: shop.display_id,
            name: shop.name,
            shop_logo_url: shop.shop_logo_url,
          }))
        );
      } catch (error) {
        console.error("Failed to load shops", error);
      }
    };

    const loadAnnouncements = async () => {
      try {
        const rows = await api.announcements.list();
        if (!mounted) return;
        setAnnouncements((rows || []).filter((item) => item.banner_scope === "system"));
      } catch (error) {
        console.error("Failed to load announcements", error);
      }
    };

    const loadLatestProducts = async () => {
      try {
        const pageData = await api.products.getProductsPage({ page: 1, page_size: 8 });
        if (!mounted) return;
        setLatestProducts(pageData.items || []);
      } catch (error) {
        console.error("Failed to load latest products", error);
      }
    };

    trackHomepageVisit();
    loadShops();
    loadAnnouncements();
    loadHomepageCollections();
    loadLatestProducts();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen w-full bg-white dark:bg-gray-950">
      <div className="w-full px-4">
        <div className="w-full space-y-4">
          <AnnouncementsRibbon items={announcements} onItemClick={handleAnnouncementClick} />

          <ShopRibbon shops={shops} onShopClick={(shop) => router.push(`/shops/${shop.display_id}`)} />

          {homepageRibbonRows.length > 0 ? (
            <section className="space-y-4">
              {homepageRibbonRows.map((row) => (
                <div key={row.collection.id}>
                  <Ribbon
                    title={row.collection.name}
                    action={
                      <Link href={`/collections/${row.collection.id}`} className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-slate-100">
                        View all
                      </Link>
                    }
                    items={row.items}
                    renderItem={(product: ProductListItem) => (
                      <div className="w-[12.5rem] min-w-0 flex-shrink-0">
                        <Product product={product} size="default" hideShop={false} />
                      </div>
                    )}
                    className="!mx-0 !rounded-3xl !border !border-slate-200 !shadow-sm !py-6 !px-6"
                  />
                  {row.items.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">No products yet in this collection.</p>
                  ) : null}
                </div>
              ))}
            </section>
          ) : null}

          <section className="rounded-3xl border border-slate-200 bg-rose-50 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Latest Products</h2>
                <p className="mt-1 text-sm text-slate-600">Newest arrivals from our artisans.</p>
              </div>
              <Link href="/sarees" className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-slate-100">
                View all
              </Link>
            </div>
            <ProductGrid products={latestProducts} hideShop={false} showCheckboxes={false} scope="public" />
          </section>
        </div>
      </div>
    </main>
  );
}
