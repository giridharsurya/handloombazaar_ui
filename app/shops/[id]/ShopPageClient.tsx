"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ShopDetailsPage from "@/components/Shop/ShopDetailsPage";
import { VariantSelectionProvider } from "@/lib/VariantSelectionContext";
import api from "@/lib/api";
import type { ProductListItem, ShopDetail } from "@/types/apiTypes";

export default function ShopPageClient() {
  const params = useParams();
  const displayId = typeof params?.id === "string" ? params.id : undefined;
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!displayId) {
      setError("Invalid shop id.");
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadShop = async () => {
      setLoading(true);
      setError(null);
      try {
        const shopData = await api.shops.getDetail({ display_id: displayId });
        const productData = await api.products.getProducts({ page: 1, page_size: 20, shop_display_id: displayId });
        if (!mounted) return;
        setShop(shopData);
        setProducts(productData);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load shop");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadShop();
    return () => {
      mounted = false;
    };
  }, [displayId]);

  if (loading) {
    return <div className="px-4 py-6 text-sm text-slate-600">Loading shop...</div>;
  }

  if (error || !shop) {
    return <div className="px-4 py-6 text-sm text-rose-600">{error || "Shop not found."}</div>;
  }

  return (
    <VariantSelectionProvider>
      <ShopDetailsPage shop={shop} products={products} scope={"public"} />
    </VariantSelectionProvider>
  );
}
