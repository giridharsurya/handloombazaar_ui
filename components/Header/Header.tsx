"use client";

import React from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar/SearchBar";
import ShortRibbon from "@/components/ShortRibbon/ShortRibbon";

export default function Header() {
  return (
    <div className="w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <div className="w-full pt-8 px-4">
        <div className="w-full flex justify-center mb-8">
          <div className="flex items-center gap-6">
            <Link
  href="/"
  className="text-3xl font-bold text-gray-900 dark:text-white hover:text-rose-600 transition-colors"
>
  Handloom Bazaar
</Link>
            <div className="w-[500px]">
              <SearchBar />
            </div>
          </div>
        </div>

        {/* Short navigation bar */}
        <ShortRibbon />
      </div>
    </div>
  );
}
