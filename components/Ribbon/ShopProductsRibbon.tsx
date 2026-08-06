"use client";

import React from "react";
import Ribbon from "@/components/Ribbon/Ribbon";
import Product from "@/components/Product/Product";
import type { ProductListItem, ShopStatusResponse } from "@/types/apiTypes";

type ShopProductsRibbonProps = {
  shop: ShopStatusResponse;
  products?: ProductListItem[];
};

export default function ShopProductsRibbon({ shop, products }: ShopProductsRibbonProps) {
  const shopProducts: ProductListItem[] = products || [];

  return (
    <Ribbon
      title={shop.name}
      action={
        <a href={`/shops/${shop.display_id}`} className="text-sm text-rose-600 hover:underline">
          View all
        </a>
      }
      items={shopProducts}
      renderItem={(product: ProductListItem) => (
        <div className="min-w-[12.5rem]">
        <Product product={product as ProductListItem} size="default" hideShop={true} />
        </div>
      )}
      className="!mx-0 !rounded-3xl !border !border-slate-200 !shadow-sm !py-6 !px-6"
    />
  );
}
