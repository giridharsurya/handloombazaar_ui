"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ProductGrid from "@/components/Product/ProductGrid";
import ShopRibbon from "@/components/Ribbon/ShopRibbon";
import Ribbon from "@/components/Ribbon/Ribbon";
import AnnouncementsRibbon from "@/components/Ribbon/AnnouncementsRibbon";
import Product from "@/components/Product/Product";
import api from "@/lib/api";
import type { AnnouncementBanner, ProductListItem } from "@/types/apiTypes";
import type { HomepageData } from "./page";

type HomeShopItem = {
  display_id: string;
  shop_slug?: string;
  name: string;
  shop_logo_url: string;
};

type HomepageRibbonRow = HomepageData["homepageRibbonRows"][number];

type HomePageContentProps = {
  initialData: HomepageData;
};

export default function HomePageContent({ initialData }: HomePageContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [shops] = useState<HomeShopItem[]>(initialData.shops);
  const [announcements] = useState<AnnouncementBanner[]>(initialData.announcements);
  const [homepageRibbonRows] = useState<HomepageRibbonRow[]>(initialData.homepageRibbonRows);
  const [latestProducts] = useState<ProductListItem[]>(initialData.latestProducts);

  const handleAnnouncementClick = (item: AnnouncementBanner) => {
    const target = item.target ?? "/";
    try {
      const url = new URL(target, window.location.origin);
      if (url.pathname === "/sarees" && item.title) {
        url.searchParams.set("announcement_title", item.title);
      }
      router.push(`${url.pathname}${url.search}${url.hash}`);
    } catch {
      router.push(target);
    }
  };

  useEffect(() => {
    if (pathname !== "/") return;
    void api.analytics.trackHomepageVisit().catch((error) => {
      console.error("Failed to track homepage visit", error);
    });
  }, [pathname]);

  return (
    <main className="min-h-screen w-full bg-white dark:bg-gray-950">
      <div className="w-full px-4">
        <div className="w-full space-y-4">
          <AnnouncementsRibbon items={announcements} onItemClick={handleAnnouncementClick} />

          <ShopRibbon shops={shops} onShopClick={(shop) => {
            if (!shop.shop_slug) return;
            router.push(`/shops/${shop.shop_slug}`);
          }} />

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
