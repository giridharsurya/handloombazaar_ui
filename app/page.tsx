"use client";

import React, { useEffect, useState } from "react";
import ShopRibbon from "@/components/Ribbon/ShopRibbon";
import FeaturedRibbon from "@/components/Ribbon/FeaturedRibbon";
import AnnouncementsRibbon from "@/components/Ribbon/AnnouncementsRibbon";
import api from "@/lib/api";
import type { ShopSummary } from "@/types/apiTypes";

export default function Home() {
  const [shops, setShops] = useState<ShopSummary[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadShops = async () => {
      try {
        const rows = await api.shops.list();
        if (!mounted) return;
        setShops(
          rows.map((shop) => ({
            display_id: shop.display_id,
            name: shop.name,
            shop_logo_url: shop.shop_logo_url,
          }))
        );
      } catch (error) {
        console.error("Failed to load shops", error);
      }
    };

    loadShops();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen w-full bg-white dark:bg-gray-950">
      <div className="w-full px-4">
        <div className="w-full space-y-4">
          {/* Announcements / Collections ribbon */}
          <AnnouncementsRibbon />

          <ShopRibbon shops={shops} onShopClick={(shop) => console.log("shop click", shop)} />

          {/* Featured Section */}
          <FeaturedRibbon />
        </div>
      </div>
    </main>
  );
}
