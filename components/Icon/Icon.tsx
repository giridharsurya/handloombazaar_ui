"use client";

import React from "react";
import { IconProps } from "@/types";
import resolveImageUrl from "@/lib/resolveImage";

export default function Icon({ imageUrl, label, onClick, variant = "default", size = 72 }: IconProps & { size?: number }) {
  const ringSize = size + 16; // outer ring is larger than image to create gap
  const innerSize = size;

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`group relative flex flex-col items-center justify-start gap-2 p-2 bg-transparent transition-transform duration-200`}
    >
      <div style={{ width: ringSize, height: ringSize }} className="relative flex items-center justify-center">
        {/* Rotating outer ring (separate element so the image itself doesn't rotate) */}
        <span
          aria-hidden
          className={`absolute inset-0 m-0 rounded-full border-3 border-rose-900 transition-all duration-300 pointer-events-none group-hover:rotate-12 group-hover:border-dotted group-hover:border-rose-600`}
        />

        {/* Inner image that grows on hover */}
        <div style={{ width: innerSize, height: innerSize }} className="relative rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm transition-transform duration-300 group-hover:scale-105">
          {imageUrl ? (
            <img src={resolveImageUrl(imageUrl)} alt={label} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-center h-full">{label?.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
      </div>

      <div className="text-xs text-center text-gray-900 dark:text-gray-100 font-medium max-w-[88px] truncate">{label}</div>
    </button>
  );
}
