"use client";

import React from "react";
import Ribbon from "@/components/Ribbon/Ribbon";
import Image from "next/image";
import Link from "next/link";
import { mockAnnouncements } from "@/lib/mockData";

type Ann = { id: string; title: string; image_url?: string; target?: string };

export default function AnnouncementsRibbon({ items = mockAnnouncements }: { items?: Ann[] }) {
  return (
    <Ribbon
      className="px-4"
      items={items}
      renderItem={(it: Ann) => (
        <div className="announcement-item flex-shrink-0" style={{ width: 'calc(50% - 0.5rem)' }}>
          <Link href={it.target ?? '#'} className="block rounded overflow-hidden border-2 border-gray-300 shadow-md bg-white dark:bg-gray-900 hover:shadow-lg transition-shadow">
            <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200">
              {it.image_url ? (
                <Image src={it.image_url} alt={it.title} fill style={{ objectFit: 'cover' }} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-600 font-semibold">{it.title}</div>
              )}
            </div>
          </Link>
        </div>
      )}
    />
  );
}
