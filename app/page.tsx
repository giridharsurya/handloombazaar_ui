"use client";

import Image from "next/image";
import ShopRibbon from "@/components/ShopRibbon/ShopRibbon";
import CategoryRibbon from "@/components/CategoryRibbon/CategoryRibbon";
import SearchBar from "@/components/SearchBar/SearchBar";
import FeaturedRibbon from "@/components/FeaturedRibbon/FeaturedRibbon";
import AnnouncementsRibbon from "@/components/AnnouncementsRibbon/AnnouncementsRibbon";
import ShortRibbon from "@/components/ShortRibbon/ShortRibbon";
import { mockShops, mockCategories, mockFeatured } from "@/lib/mockData";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-white dark:bg-gray-950">
      <div className="w-full py-8 px-4">
        <div className="w-full">
          <div className="w-full flex justify-center mb-8">
            <div className="flex items-center gap-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Handloom Bazaar</h1>

              <div className="w-[500px]">
                <SearchBar />
              </div>
            </div>
          </div>

          {/* Short navigation bar */}
          <ShortRibbon />

          {/* Announcements / Collections ribbon */}
          <AnnouncementsRibbon />

          {/* Shops Section */}
          <ShopRibbon shops={mockShops} onShopClick={(s) => console.log("shop click", s)} />

          {/* Categories Section */}
          <CategoryRibbon categories={mockCategories} onCategoryClick={(c) => console.log("cat click", c)} />

          {/* Featured Section */}
          <FeaturedRibbon items={mockFeatured} />
        </div>
      </div>
    </main>
  );
}
