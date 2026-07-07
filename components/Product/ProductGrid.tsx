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
};

export default function ProductGrid({ products, hideShop = false, hideCategory = false, showCheckboxes = false, scope }: ProductGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.display_id}
          product={product}
          size="default"
          hideShop={hideShop}
          hideCategory={hideCategory}
          showCheckboxes={showCheckboxes}
          scope={scope}
        />
      ))}
    </div>
  );
}
