"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductGrid from "@/components/Product/ProductGrid";
import ShopRibbon from "@/components/Ribbon/ShopRibbon";
import FeaturedRibbon from "@/components/Ribbon/FeaturedRibbon";
import AnnouncementsRibbon from "@/components/Ribbon/AnnouncementsRibbon";
import api from "@/lib/api";
import type { AnnouncementBanner, Collection, ProductListItem, ShopStatusResponse } from "@/types/apiTypes";

type HomeShopItem = {
  display_id: string;
  name: string;
  shop_logo_url: string;
};

export default function Home() {
  const router = useRouter();
  const [shops, setShops] = useState<HomeShopItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementBanner[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductListItem[]>([]);
  const [latestProducts, setLatestProducts] = useState<ProductListItem[]>([]);

  useEffect(() => {
    let mounted = true;

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

    const loadFeaturedCollectionProducts = async () => {
      try {
        const collections = (await api.collections.list({ kind: "system", authenticated: false })) as Collection[];
        if (!mounted) return;

        const featured = collections.find((collection: Collection) => /featured/i.test(collection.name) || /featured/i.test(collection.display_id));

        if (!featured) {
          setFeaturedProducts([]);
          return;
        }

        const pageData = await api.collections.getProductsPage(featured.id, {
          authenticated: false,
          page: 1,
          page_size: 8,
        });
        if (!mounted) return;
        setFeaturedProducts((pageData.items || []).filter((item) => item.is_active !== false));
      } catch (error) {
        console.error("Failed to load featured collection products", error);
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

    loadShops();
    loadAnnouncements();
    loadFeaturedCollectionProducts();
    loadLatestProducts();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen w-full bg-white dark:bg-gray-950">
      <div className="w-full px-4">
        <div className="w-full space-y-4">
          <AnnouncementsRibbon items={announcements} />

          <ShopRibbon shops={shops} onShopClick={(shop) => router.push(`/shops/${shop.display_id}`)} />

          <FeaturedRibbon items={featuredProducts.slice(0, 6)} />

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
