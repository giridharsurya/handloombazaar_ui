"use client";

import React from "react";
import { Product } from "@/types";
import ProductCard from "@/components/Product/Product";

type ProductGridProps = {
  products: Product[];
  hideShop?: boolean;
  hideCategory?: boolean;
};

export default function ProductGrid({ products, hideShop = false, hideCategory = false }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          size="default"
          hideShop={hideShop}
          hideCategory={hideCategory}
        />
      ))}
    </div>
  );
}
