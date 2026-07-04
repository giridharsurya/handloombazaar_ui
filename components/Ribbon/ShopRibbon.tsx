"use client";

import React from "react";
import Ribbon from "@/components/Ribbon/Ribbon";
import Icon from "@/components/Icon/Icon";
import { ShopSummary } from "@/types/apiTypes";

type Props = {
  shops: ShopSummary[];
  onShopClick?: (shop: ShopSummary) => void;
};

export default function ShopRibbon({ shops, onShopClick }: Props) {
  return (
    <Ribbon
      title="Shops"
      action={
        <a href="/shops" className="text-sm text-rose-600 hover:underline">
          View shops
        </a>
      }
      items={shops}
      renderItem={(shop) => (
        <Icon imageUrl={shop.shop_logo_url} label={shop.name} onClick={() => onShopClick?.(shop)} variant="shop" />
      )}
    />
  );
}
