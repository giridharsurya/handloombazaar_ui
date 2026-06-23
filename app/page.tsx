"use client";

import ShopRibbon from "@/components/ShopRibbon/ShopRibbon";
import CategoryRibbon from "@/components/CategoryRibbon/CategoryRibbon";
import FeaturedRibbon from "@/components/FeaturedRibbon/FeaturedRibbon";
import AnnouncementsRibbon from "@/components/AnnouncementsRibbon/AnnouncementsRibbon";
import { mockShops, mockCategories } from "@/lib/mockData";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-white dark:bg-gray-950">
      <div className="w-full px-4">
        <div className="w-full space-y-4">
          {/* Announcements / Collections ribbon */}
          <AnnouncementsRibbon />

          {/* Shops Section */}
          <ShopRibbon shops={mockShops} onShopClick={(s) => console.log("shop click", s)} />

          {/* Categories Section */}
          <CategoryRibbon categories={mockCategories} onCategoryClick={(c) => console.log("cat click", c)} />

          {/* Featured Section */}
          <FeaturedRibbon />
        </div>
      </div>
    </main>
  );
}
