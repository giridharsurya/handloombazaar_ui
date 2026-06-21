"use client";

import React from "react";
import Ribbon from "@/components/Ribbon/Ribbon";
import Image from "next/image";
import { mockFeatured } from "@/lib/mockData";

type FeaturedItem = {
  id: string;
  title: string;
  image_url?: string;
};

export default function FeaturedRibbon({ items = mockFeatured }: { items?: FeaturedItem[] }) {
  return (
    <Ribbon
      title="Featured Sarees"
      action={
        <a href="/featured" className="text-sm text-rose-600 hover:underline">
          View featured
        </a>
      }
      items={items}
      renderItem={(it: FeaturedItem, index?: number) => {
        const pastelColors = ['bg-yellow-100', 'bg-pink-100', 'bg-blue-100', 'bg-purple-100', 'bg-green-100'];
        const bgColor = pastelColors[(index ?? 0) % pastelColors.length];
        return (
          <div className="w-80 rounded overflow-hidden border border-gray-300 bg-white dark:bg-gray-900 shadow-sm">
            <div className={`relative h-44 ${bgColor}`}>
              {it.image_url ? (
                <Image src={it.image_url} alt={it.title} fill style={{ objectFit: "cover" }} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-600">No image</div>
              )}
            </div>
            <div className="p-3">
              <div className="font-semibold text-gray-900">{it.title}</div>
            </div>
          </div>
        );
      }}
    />
  );
}
