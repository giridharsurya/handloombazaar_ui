"use client";

import React from "react";
import Ribbon from "@/components/Ribbon/Ribbon";
import Link from "next/link";
import type { AnnouncementBanner } from "@/types/apiTypes";

type Ann = Pick<AnnouncementBanner, "id" | "title" | "subtitle" | "background_color" | "text_color" | "target" | "collection_id">;

export default function AnnouncementsRibbon({
  items = [] as Ann[],
  onItemClick,
}: {
  items?: Ann[];
  onItemClick?: (item: Ann) => void;
}) {
  return (
    <Ribbon
      className="px-4"
      items={items}
      renderItem={(it: Ann) => (
        <div className="announcement-item flex-shrink-0" style={{ width: 'calc(50% - 0.5rem)' }}>
          {onItemClick ? (
            <button
              type="button"
              onClick={() => onItemClick(it)}
              className="block w-full rounded overflow-hidden border-2 border-gray-300 shadow-md hover:shadow-lg transition-shadow text-left"
              style={{ backgroundColor: it.background_color || "#F43F5E", color: it.text_color || "#FFFFFF" }}
            >
              <div className="h-40 p-5 flex flex-col justify-center">
                <p className="text-lg font-semibold leading-snug">{it.title}</p>
                {it.subtitle ? <p className="mt-2 text-sm opacity-95">{it.subtitle}</p> : null}
              </div>
            </button>
          ) : (
            <Link
              href={it.target ?? '#'}
              className="block rounded overflow-hidden border-2 border-gray-300 shadow-md hover:shadow-lg transition-shadow"
              style={{ backgroundColor: it.background_color || "#F43F5E", color: it.text_color || "#FFFFFF" }}
            >
              <div className="h-40 p-5 flex flex-col justify-center">
                <p className="text-lg font-semibold leading-snug">{it.title}</p>
                {it.subtitle ? <p className="mt-2 text-sm opacity-95">{it.subtitle}</p> : null}
              </div>
            </Link>
          )}
        </div>
      )}
    />
  );
}
