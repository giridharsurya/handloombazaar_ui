"use client";

import React from "react";
import { Shop } from "@/types";
import Ribbon from "@/components/Ribbon/Ribbon";
import Product from "@/components/Product/Product";
import { mockSarees } from "@/lib/mockData";
import type { Product as ProductType } from "@/types";

type ShopSectionProps = {
  shop: Shop;
};

export default function ShopSection({ shop }: ShopSectionProps) {
  const shopProducts = mockSarees.filter(
    (product) => product.shop_id === shop.id
  );

  return (
    <Ribbon
      title={shop.name}
      action={
        <a href={`/shops/${shop.id}`} className="text-sm text-rose-600 hover:underline">
          View all
        </a>
      }
      items={shopProducts}
      renderItem={(product: ProductType) => (
        <Product product={product} size="compact" hideShop={true} />
      )}
    />
  );
}