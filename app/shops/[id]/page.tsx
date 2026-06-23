import React from "react";
import { notFound } from "next/navigation";
import ShopDetailsPage from "@/components/ShopDetails/ShopDetailsPage";
import { mockShops, mockSarees } from "@/lib/mockData";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ShopPage({ params }: PageProps) {
  const { id } = await params;
  const shopId = Number(id);

  if (!Number.isFinite(shopId)) {
    notFound();
  }

  const shop = mockShops.find((item) => Number(item.id) === shopId);

  if (!shop) {
    notFound();
  }

  const products = mockSarees.filter((item) => item.shop_id === shopId);

  return <ShopDetailsPage shop={shop} products={products} />;
}
