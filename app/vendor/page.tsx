"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useApi } from "@/lib/ApiProvider";
import { useRouter } from "next/navigation";
import ShopDetailsPage from "@/components/Shop/ShopDetailsPage";
import ProductActionsSidebar from "@/components/Product/ProductActionsSidebar";
import type { ProductListItem, ShopDetail } from "@/types/apiTypes";

export default function VendorPage() {
  const { auth, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // All state hooks first
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Safe even when auth is null
  const shopDisplayId = auth?.shop_display_id;

  const api = useApi();

  // Auth check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (!isLoading && auth && auth.role !== "shop_owner") {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, auth, router]);

  // Data fetching
  useEffect(() => {
    if (!shopDisplayId) {
      return;
    }

    const fetchVendorData = async () => {
      setLoadingData(true);
      try {
        const productsData = await api.products.getProducts({ shop_display_id: shopDisplayId, authenticated: true });
        setProducts(productsData);
        // Fetch full shop details for ShopDetailsPage
        const shopDetail = await api.shops.getDetail({ display_id: shopDisplayId });
        setShop(shopDetail);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchVendorData();
  }, [shopDisplayId, api]);

  // Only AFTER all hooks
  if (isLoading) {
    return <div>Loading auth...</div>;
  }

  if (!auth) {
    return null;
  }

  if (auth.role !== "shop_owner") {
    return null;
  }

  if (loadingData) {
    return <div>Loading vendor data...</div>;
  }

  if (!shop) {
    return <div>Shop not found.</div>;
  }

  const scope = shopDisplayId ? `vendor:${shopDisplayId}` : undefined;
  return (
    <div>
      <ShopDetailsPage shop={shop} products={products} scope={scope} />
      <ProductActionsSidebar scope={scope} />
    </div>
  );
}