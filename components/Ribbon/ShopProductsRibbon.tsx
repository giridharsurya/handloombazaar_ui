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
        <a href={shop.shop_slug ? `/shops/${shop.shop_slug}` : '#'} className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-slate-100" aria-disabled={!shop.shop_slug}>
          View all
        </a>
      }
      items={shopProducts}
      renderItem={(product: ProductListItem) => (
        <div className="w-[12.5rem] min-w-0 flex-shrink-0">
        <Product product={product as ProductListItem} size="default" hideShop={true} />
        </div>
      )}
      className="!mx-0 !rounded-3xl !border !border-slate-200 !shadow-sm !py-6 !px-6"
    />
  );
}
