"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useApi } from "@/lib/ApiProvider";
import { useRouter } from "next/navigation";
import ProductCreateForm from "@/components/Product/ProductCreateForm";

export default function AddProductPage() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();
  const [shopStatus, setShopStatus] = useState<{ approved: boolean; name?: string } | null>(null);
  const api = useApi();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isLoading && !auth) {
      router.push("/auth/login");
      return;
    }
    if (!isLoading && auth && auth.role !== "shop_owner") {
      router.push("/");
    }
  }, [auth, isLoading, router]);

  // Fetch authoritative shop status and redirect if not approved
  React.useEffect(() => {
    const loadStatus = async () => {
      if (auth && auth.shop_display_id) {
        try {
          const res = await api.shops.getStatus({ display_id: auth.shop_display_id });
          setShopStatus({ approved: !!res.approved, name: res.name });
          if (!res.approved) {
            router.push("/vendor/dashboard");
          }
        } catch (e) {
          // ignore — fallback to auth-based behavior
        }
      }
    };
    loadStatus();
  }, [auth, router, api]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!auth || auth.role !== "shop_owner" || (shopStatus && !shopStatus.approved)) {
    return null;
  }

  return (
    <ProductCreateForm
      title="Add New Product"
      subtitle="Create and list a new product in your shop"
      backHref="/vendor/dashboard"
      backLabel="← Back to Dashboard"
      redirectAfterSuccessHref="/vendor/products/add"
      fixedShopDisplayId={auth.shop_display_id || undefined}
    />
  );
}
