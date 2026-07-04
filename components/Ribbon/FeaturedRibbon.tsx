"use client";

import React from "react";
import Ribbon from "@/components/Ribbon/Ribbon";
import Product from "@/components/Product/Product";
// Featured items should be provided by parent via `items` prop or fetched by a wrapper.
import type { Product as ProductType } from "@/types";

type Props = {
  items?: ProductType[];
};

export default function FeaturedRibbon({ items = [] }: Props) {
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
