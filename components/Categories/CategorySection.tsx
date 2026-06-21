"use client";

import React from "react";
import { Category } from "@/types";
import Ribbon from "@/components/Ribbon/Ribbon";
import Product from "@/components/Product/Product";
import { mockSarees } from "@/lib/mockData";
import type { Product as ProductType } from "@/types";

type CategorySectionProps = {
  category: Category;
};

export default function CategorySection({ category }: CategorySectionProps) {
  const categoryProducts = mockSarees.filter(
    (product) => product.category === category.name
  );

  return (
    <Ribbon
      title={category.name}
      action={
        <a href={`/categories/${category.id}`} className="text-sm text-rose-600 hover:underline">
          View all
        </a>
      }
      items={categoryProducts}
      renderItem={(product: ProductType) => (
        <Product product={product} size="compact" hideCategory={true} />
      )}
    />
  );
}