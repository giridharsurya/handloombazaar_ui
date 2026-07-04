import React from "react";
import { notFound } from "next/navigation";
import ProductDetails from "@/components/Product/ProductDetails";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8000";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SareeDetailsPage({ params }: PageProps) {
  const { id } = await params;
  // Fetch product detail from API
  const res = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(id)}`);
  if (!res.ok) return notFound();
  const json = await res.json();
  const product = json.product;
  // Fetch variants and similar items via products endpoints if desired (omitted for brevity)

  return <ProductDetails product={product} shop={product.shop} variants={[]} similarFromShop={[]} similarFromOtherShops={[]} />;
}
