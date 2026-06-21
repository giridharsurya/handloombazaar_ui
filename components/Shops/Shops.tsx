"use client";

import React from "react";
import { Shop } from "@/types";
import ShopSection from "@/components/Shops/ShopSection";

type ShopsProps = {
  shops: Shop[];
};

export default function Shops({ shops }: ShopsProps) {
  return (
    <div className="space-y-12">
      {shops.map((shop) => (
        <ShopSection key={shop.id} shop={shop} />
      ))}
    </div>
  );
}
