"use client";

import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useApi } from "@/lib/ApiProvider";
import { useRouter } from "next/navigation";
import ProductCreateForm from "@/components/Product/ProductCreateForm";

export default function AdminAddProductPage() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();
  const api = useApi();

  const [shops, setShops] = React.useState<{ display_id: string; name: string }[]>([]);
  const [loadingShops, setLoadingShops] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoading && !auth) {
      router.push("/auth/login");
      return;
    }
    if (!isLoading && auth && auth.role !== "admin") {
      router.push("/");
    }
  }, [auth, isLoading, router]);

  React.useEffect(() => {
    if (isLoading || !auth || auth.role !== "admin") return;

    let cancelled = false;
    const loadShops = async () => {
      setLoadingShops(true);
      setError(null);
      try {
        const rows = await api.admin.getShops();
        if (cancelled) return;
        const normalized = (rows || [])
          .filter((s: any) => !!s.display_id)
          .map((s: any) => ({ display_id: String(s.display_id), name: String(s.name) }));
        setShops(normalized);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load shops";
        setError(msg);
      } finally {
        if (!cancelled) setLoadingShops(false);
      }
    };

    loadShops();
    return () => {
      cancelled = true;
    };
  }, [isLoading, auth, api]);

  if (isLoading) {
    return <div>Loading auth...</div>;
  }

  if (!auth || auth.role !== "admin") {
    return null;
  }

  if (loadingShops) {
    return <div>Loading shops...</div>;
  }

  if (error) {
    return <div className="p-6 text-rose-600">{error}</div>;
  }

  return (
    <ProductCreateForm
      title="Add Product (Admin)"
      subtitle="Create a product for any selected shop"
      backHref="/admin"
      backLabel="← Back to Admin"
      redirectAfterSuccessHref="/admin/products/add"
      allowShopSelect={true}
      shopOptions={shops}
    />
  );
}
