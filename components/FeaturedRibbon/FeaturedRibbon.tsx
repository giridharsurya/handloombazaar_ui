"use client";

import React from "react";
import Ribbon from "@/components/Ribbon/Ribbon";
import Product from "@/components/Product/Product";
import { mockSarees } from "@/lib/mockData";
import type { Product as ProductType } from "@/types";

type Props = {
  items?: ProductType[];
};

export default function FeaturedRibbon({ items = mockSarees.slice(0, 8) }: Props) {
  return (
    <Ribbon
      title="Featured Sarees"
      action={
        <a href="/featured" className="text-sm text-rose-600 hover:underline">
          View featured
        </a>
      }
      items={items}
      renderItem={(product: ProductType) => (
        <Product product={product} size="compact" />
      )}
    />
  );
}
