"use client";

import React from "react";
import { ProductListItem } from "@/types/apiTypes";
import ProductCard from "@/components/Product/Product";

type ProductGridProps = {
  products: ProductListItem[];
  hideShop?: boolean;
  hideCategory?: boolean;
  showCheckboxes?: boolean;
  scope?: string;
  variantMode?: boolean;
  mainProductId?: string;
  variantProductIds?: Set<string>;
};

export default function ProductGrid({ products, hideShop = false, hideCategory = false, showCheckboxes = false, scope, variantMode = false, mainProductId, variantProductIds }: ProductGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.display_id}
          product={product}
          size="default"
          hideShop={hideShop}
          hideCategory={hideCategory}
          showCheckboxes={showCheckboxes}
          scope={scope}
          variantMode={variantMode}
          isMainProduct={variantMode && product.display_id === mainProductId}
          isVariantProduct={variantMode && variantProductIds?.has(product.display_id)}
        />
      ))}
    </div>
  );
}
