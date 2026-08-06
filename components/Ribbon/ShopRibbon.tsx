"use client";

import React from "react";
import Link from "next/link";
import Ribbon from "@/components/Ribbon/Ribbon";
import Icon from "@/components/Icon/Icon";

type ShopRibbonItem = {
  display_id: string;
  name: string;
  shop_logo_url: string;
};

type Props = {
  shops: ShopRibbonItem[];
  onShopClick?: (shop: ShopRibbonItem) => void;
};

export default function ShopRibbon({ shops, onShopClick }: Props) {
  return (
    <Ribbon
      title="Shops"
      action={
        <Link href="/shops" className="text-sm text-rose-600 hover:underline">
          View shops
        </Link>
      }
      items={shops}
      renderItem={(shop) => (
        <Icon imageUrl={shop.shop_logo_url} label={shop.name} onClick={() => onShopClick?.(shop)} variant="shop" />
      )}
    />
  );
}
