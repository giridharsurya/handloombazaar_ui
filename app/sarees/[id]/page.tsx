import React from "react";
import { notFound } from "next/navigation";
import ProductDetails from "@/components/ProductDetails/ProductDetails";
import { mockSarees, mockShops } from "@/lib/mockData";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SareeDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const product = mockSarees.find((item) => String(item.id) === id);

  if (!product) {
    notFound();
  }

  const shop = mockShops.find((item) => item.id === product.shop_id) ?? null;

  const variants = mockSarees
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 10);

  const similarFromShop = mockSarees
    .filter((item) => item.shop_id === product.shop_id && item.id !== product.id)
    .slice(0, 10);

  const similarFromOtherShops = mockSarees
    .filter(
      (item) =>
        item.category === product.category &&
        item.shop_id !== product.shop_id &&
        item.id !== product.id
    )
    .slice(0, 10);

  return (
    <ProductDetails
      product={product}
      shop={shop}
      variants={variants}
      similarFromShop={similarFromShop}
      similarFromOtherShops={similarFromOtherShops}
    />
  );
}
