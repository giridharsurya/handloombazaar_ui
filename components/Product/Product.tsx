"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";

type ProductProps = {
  product: Product;
  size?: "default" | "compact";
  hideShop?: boolean;
  hideCategory?: boolean;
};

export default function Product({ product, size = "default", hideShop = false, hideCategory = false }: ProductProps) {
  const isCompact = size === "compact";

  return (
    <Link
      href={`/sarees/${product.id}`}
      aria-label={`View ${product.name}`}
      className={`block bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-rose-500 ${isCompact ? "w-40" : ""}`}
    >
      {/* Image Container */}
      <div className={`relative bg-yellow-100 overflow-hidden ${isCompact ? "h-40" : "h-64"}`}>
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          style={{ objectFit: "cover" }}
        />
      </div>

      {/* Content Container */}
      <div className={isCompact ? "p-2" : "p-4"}>
        {/* Shop Info */}
        {!hideShop && (
          <div className={`flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700 ${isCompact ? "mb-2" : "mb-3"}`}>
            <div className={`relative rounded-full overflow-hidden flex-shrink-0 bg-gray-200 ${isCompact ? "w-6 h-6" : "w-8 h-8"}`}>
              <Image
                src={product.shop_logo_url}
                alt={product.shop_name}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
            <span className={`font-semibold text-gray-700 dark:text-gray-300 ${isCompact ? "text-xs" : "text-xs"}`}>
              {isCompact ? product.shop_name.split(" ")[0] : product.shop_name}
            </span>
          </div>
        )}

        <h3 className={`font-semibold text-gray-900 dark:text-white line-clamp-2 ${isCompact ? "text-xs mb-1" : "text-sm mb-2"}`}>
          {product.name}
        </h3>

        {/* {!isCompact && (
          <>
            {!hideCategory && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {product.category}
              </p>
            )}

            <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
              {product.description}
            </p>
          </>
        )} */}

        <div className={`flex items-center ${isCompact ? "justify-between gap-1" : "justify-between"}`}>
          <span className={`font-bold text-rose-600 ${isCompact ? "text-xs" : "text-lg"}`}>
            ₹{product.price.toLocaleString()}
          </span>
          <span className={`text-rose-600 ${isCompact ? "text-xs" : "text-sm font-medium"}`}>
            View
          </span>
          {/* {!isCompact && (
            <span className="px-3 py-2 bg-gray-300 text-gray-600 text-xs rounded opacity-50">
              Add to Cart
            </span>
          )} */}
        </div>
      </div>
    </Link>
  );
}
