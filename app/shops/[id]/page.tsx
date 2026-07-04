import React from "react";
import { notFound } from "next/navigation";
import ShopDetailsPage from "@/components/Shop/ShopDetailsPage";
import api from "@/lib/api";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ShopPage({ params }: PageProps) {
  const { id } = await params;
  const displayId = id;
  try {
    const shop = await api.shops.getDetail({ display_id: displayId });
    const products = await api.products.getProducts({ page: 1, page_size: 100, shop_display_id: displayId });
    return <ShopDetailsPage shop={shop} products={products} />;
  } catch (e) {
    return notFound();
  }
}
