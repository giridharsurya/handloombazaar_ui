"use client";

import React from "react";
import BackendImage from "@/components/BackendImage/BackendImage";
import Link from "next/link";
import type { ProductListItem } from "@/types/apiTypes";
import type { Product as LocalProduct } from "@/types";
import { useProductSelection, useSelectionScope } from "@/lib/productSelection";

type ProductProps = {
  product: ProductListItem | LocalProduct;
  size?: "default" | "compact";
  hideShop?: boolean;
  hideCategory?: boolean;
  selected?: boolean;
  onToggle?: (id: string) => void;
  showCheckboxes?: boolean;
  scope?: string;
};

export default function Product({ product, size = "default", hideShop = false, hideCategory = false, selected, onToggle, showCheckboxes = false, scope }: ProductProps) {
  const resolvedScope = useSelectionScope(scope);
  const selection = useProductSelection(showCheckboxes ? resolvedScope : undefined);
  const isCompact = size === "compact";
  // determine whether the checkbox should be rendered and wired
  const effectiveSelected = typeof selected === "boolean" ? selected : (showCheckboxes ? selection.isSelected(String(product.display_id)) : false);

  const effectiveOnToggle = onToggle ?? (showCheckboxes ? ((id: string) => selection.toggle(id)) : undefined);

  return (
    <div className="relative">
      {showCheckboxes && (
        <label className="absolute z-20 top-2 left-2">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={effectiveSelected}
            onChange={(e) => {
              e.stopPropagation();
              effectiveOnToggle && effectiveOnToggle(String(product.display_id));
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${product.name}`}
          />
        </label>
      )}

      <Link
        href={`/sarees/${product.display_id}`}
        aria-label={`View ${product.name}`}
        className={`block bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-rose-500 `}
      >
        {/* Image Container */}
        <div className={`relative bg-yellow-100 overflow-hidden ${isCompact ? "h-40" : "h-64"}`}>
          {product.image_url && !String(product.image_url).startsWith("blob:") ? (
            <BackendImage src={product.image_url} alt={product.name} fill style={{ objectFit: "cover" }} />
          ) : (
            <div className="w-full h-full bg-gray-100" />
          )}
        </div>

        {/* Content Container */}
        <div className={isCompact ? "p-2" : "p-4"}>
          {/* Shop Info */}
          {!hideShop && (
            <div className={`flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700 ${isCompact ? "mb-2" : "mb-3"}`}>
              <div className={`relative rounded-full overflow-hidden flex-shrink-0 bg-gray-200 ${isCompact ? "w-6 h-6" : "w-8 h-8"}`}>
                {product.shop_logo_url && !String(product.shop_logo_url).startsWith("blob:") ? (
                  <BackendImage src={product.shop_logo_url} alt={product.shop_name} fill style={{ objectFit: "cover" }} />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
              <span className={`font-semibold text-gray-700 dark:text-gray-300 ${isCompact ? "text-xs" : "text-xs"}`}>
                {isCompact ? product.shop_name.split(" ")[0] : product.shop_name}
              </span>
            </div>
          )}

          <h3 className={`font-semibold text-gray-900 dark:text-white line-clamp-2 ${isCompact ? "text-xs mb-1" : "text-sm mb-2"}`}>
            {product.name}
          </h3>

          <div className={`flex items-center ${isCompact ? "justify-between gap-1" : "justify-between"}`}>
            <span className={`font-bold text-rose-600 ${isCompact ? "text-xs" : "text-lg"}`}>
              ₹{product.price.toLocaleString()}
            </span>
            <span className={`text-rose-600 ${isCompact ? "text-xs" : "text-sm font-medium"}`}>
              View
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
