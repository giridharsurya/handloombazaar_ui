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
  variantMode?: boolean;
  isMainProduct?: boolean;
  isVariantProduct?: boolean;
};

export default function Product({ product, size = "default", hideShop = false, hideCategory = false, selected, onToggle, showCheckboxes = false, scope, variantMode = false, isMainProduct = false, isVariantProduct = false }: ProductProps) {
  const resolvedScope = useSelectionScope(scope);
  const selection = useProductSelection(showCheckboxes ? resolvedScope : undefined);
  const isCompact = size === "compact";
  // determine whether the checkbox should be rendered and wired
  const effectiveSelected = typeof selected === "boolean" ? selected : (showCheckboxes ? selection.isSelected(String(product.display_id)) : false);

  const effectiveOnToggle = onToggle ?? (showCheckboxes ? ((id: string) => selection.toggle(id)) : undefined);
  const discountPrice = (product as any).discount_price;
  const hasDiscountPrice = discountPrice !== null && discountPrice !== undefined;
  const parsedBasePrice = Number((product as any).price);
  const hasValidBasePrice = Number.isFinite(parsedBasePrice);
  const parsedDiscountPrice = Number(discountPrice);
  const hasValidDiscountPrice = hasDiscountPrice && Number.isFinite(parsedDiscountPrice);
  const rawStockQuantity = (product as any).stock_quantity;
  const hasStockQuantity = rawStockQuantity !== null && rawStockQuantity !== undefined && Number.isFinite(Number(rawStockQuantity));
  const stockQuantity = hasStockQuantity ? Number(rawStockQuantity) : null;
  const isOutOfStock = hasStockQuantity && (stockQuantity ?? 0) <= 0;
  const isInactive = (product as any).is_active === false;
  const rawViewCount = (product as any).view_count;
  const viewCount = rawViewCount !== null && rawViewCount !== undefined && Number.isFinite(Number(rawViewCount)) ? Number(rawViewCount) : 0;
  const viewLabel = `${viewCount} view${viewCount === 1 ? "" : "s"}`;
  const productName = typeof (product as any).name === "string" && (product as any).name.trim().length > 0
    ? (product as any).name
    : "Unnamed product";
  const shopName = typeof (product as any).shop_name === "string" && (product as any).shop_name.trim().length > 0
    ? (product as any).shop_name
    : "Unknown shop";

  const formatPrice = (value: number) => value.toLocaleString("en-IN");

  return (
    <div className="relative min-w-0 w-full">
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
            aria-label={`Select ${productName}`}
          />
        </label>
      )}

      <Link
        href={`/sarees/${product.display_id}`}
        prefetch={false}
        aria-label={`View ${productName}`}
        className={`block w-full min-w-0 bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-rose-500 ${
          isMainProduct
            ? "border-4 border-red-500 dark:border-red-400"
            : isVariantProduct
            ? "border-4 border-green-500 dark:border-green-400"
            : "border border-gray-200 dark:border-gray-700"
        }`}
      >
        {(isOutOfStock || isInactive) && (
          <div className="absolute right-2 top-2 z-20 flex flex-col gap-1">
            {isOutOfStock ? (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Out of stock</span>
            ) : null}
            {isInactive ? (
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">Inactive</span>
            ) : null}
          </div>
        )}

        {/* Image Container */}
        <div className={`relative bg-yellow-100 overflow-hidden ${isCompact ? "h-44" : "h-72"}`}>
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
                    <BackendImage src={product.shop_logo_url} alt={shopName} fill style={{ objectFit: "cover" }} />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
              <span className={`font-semibold text-gray-700 dark:text-gray-300 ${isCompact ? "text-xs" : "text-xs"}`}>
                  {isCompact ? shopName.split(" ")[0] : shopName}
              </span>
            </div>
          )}

            <h3 className={`font-semibold text-gray-900 dark:text-white truncate whitespace-nowrap overflow-hidden ${isCompact ? "text-xs mb-1" : "text-sm mb-2"}`} title={productName}>
              {productName}
            </h3>

          <div className={`flex items-center ${isCompact ? "justify-between gap-1" : "justify-between"}`}>
            <div className={`flex items-center ${isCompact ? "gap-1" : "gap-2"}`}>
              {hasValidBasePrice && hasValidDiscountPrice ? (
                <>
                  <span className={`text-gray-500 line-through ${isCompact ? "text-[10px]" : "text-sm"}`}>
                    ₹{formatPrice(parsedBasePrice)}
                  </span>
                  <span className={`font-bold text-rose-600 ${isCompact ? "text-xs" : "text-lg"}`}>
                    ₹{formatPrice(parsedDiscountPrice)}
                  </span>
                </>
              ) : hasValidBasePrice ? (
                <span className={`font-bold text-rose-600 ${isCompact ? "text-xs" : "text-lg"}`}>
                  ₹{formatPrice(parsedBasePrice)}
                </span>
              ) : (
                <span className={`font-semibold text-gray-500 ${isCompact ? "text-[10px]" : "text-sm"}`}>
                  Price unavailable
                </span>
              )}
            </div>
            <span className={`text-rose-600 ${isCompact ? "text-xs" : "text-sm font-medium"}`}>
              {viewLabel}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
