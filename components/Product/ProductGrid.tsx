"use client";

import React from "react";
import { ProductListItem } from "@/types/apiTypes";
import ProductCard from "@/components/Product/Product";

type ProductGridProps = {
  products: ProductListItem[];
  hideShop?: boolean;
  hideCategory?: boolean;
};

export default function ProductGrid({ products, hideShop = false, hideCategory = false }: ProductGridProps) {

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.display_id}
          product={product}
          size="default"
          hideShop={hideShop}
          hideCategory={hideCategory}
        />
      ))}
    </div>
  );
}
