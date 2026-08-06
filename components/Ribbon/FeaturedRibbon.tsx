"use client";

import React from "react";
import Link from "next/link";
import Ribbon from "@/components/Ribbon/Ribbon";
import Product from "@/components/Product/Product";
// Featured items should be provided by parent via `items` prop or fetched by a wrapper.
import type { Product as ProductType } from "@/types";
import type { ProductListItem } from "@/types/apiTypes";

type RibbonProduct = ProductType | ProductListItem;

type Props = {
  items?: RibbonProduct[];
};

export default function FeaturedRibbon({ items = [] }: Props) {
  return (
    <Ribbon
      title="Featured Sarees"
      action={
        <Link href="/featured" className="text-sm text-rose-600 hover:underline">
          View featured
        </Link>
      }
      items={items}
      renderItem={(product: RibbonProduct) => (
        <div className="min-w-[12.5rem]">
          <Product product={product} size="default" />
        </div>
      )}
      className="!mx-0 !rounded-3xl !border !border-slate-200 !shadow-sm !py-6 !px-6"
    />
  );
}
