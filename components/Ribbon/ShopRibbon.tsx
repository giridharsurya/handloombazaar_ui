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
        <Link href="/shops" className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-slate-100">
          View all
        </Link>
      }
      items={shops}
      renderItem={(shop) => (
        <Icon imageUrl={shop.shop_logo_url} label={shop.name} onClick={() => onShopClick?.(shop)} variant="shop" />
      )}
      className="!mx-0 !rounded-3xl !border !border-slate-200 !shadow-sm !py-6 !px-6"
    />
  );
}
