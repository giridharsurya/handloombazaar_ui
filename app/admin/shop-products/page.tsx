"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/ApiProvider";
import { useAuth } from "@/lib/AuthContext";
import ShopDetailsPage from "@/components/Shop/ShopDetailsPage";
import ProductActionsSidebar from "@/components/Product/ProductActionsSidebar";
import type { ProductListItem, ShopDetail } from "@/types/apiTypes";

type AdminShopOption = {
  id: number;
  name: string;
  display_id?: string;
  approved?: boolean;
  is_active?: boolean;
};

export default function AdminShopProductsPage() {
  const { auth, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const api = useApi();

  const [shops, setShops] = useState<AdminShopOption[]>([]);
  const [selectedShopDisplayId, setSelectedShopDisplayId] = useState<string>("");
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loadingShops, setLoadingShops] = useState<boolean>(false);
  const [loadingShopData, setLoadingShopData] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (!isLoading && auth && auth.role !== "admin") {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, auth, router]);

  useEffect(() => {
    if (isLoading || !auth || auth.role !== "admin") return;

    let cancelled = false;

    const loadShops = async () => {
      setLoadingShops(true);
      setError("");
      try {
        const rows = await api.admin.getShops();
        if (cancelled) return;

        const normalized = (rows || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          display_id: s.display_id,
          approved: s.approved,
          is_active: s.is_active,
        }));

        setShops(normalized);

        setSelectedShopDisplayId((prev) => {
          if (prev) return prev;
          const first = normalized.find((s) => !!s.display_id);
          return first?.display_id || "";
        });
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load shops";
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

  useEffect(() => {
    if (isLoading || !auth || auth.role !== "admin") return;
    if (!selectedShopDisplayId) {
      setShop(null);
      setProducts([]);
      return;
    }

    let cancelled = false;

    const loadShopData = async () => {
      setLoadingShopData(true);
      setError("");
      try {
        const [productsData, shopDetail] = await Promise.all([
          api.products.getProducts({ shop_display_id: selectedShopDisplayId, authenticated: true }),
          api.shops.getDetail({ display_id: selectedShopDisplayId }),
        ]);

        if (cancelled) return;
        setProducts(productsData || []);
        setShop(shopDetail);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load selected shop";
        setError(msg);
        setProducts([]);
        setShop(null);
      } finally {
        if (!cancelled) setLoadingShopData(false);
      }
    };

    loadShopData();

    return () => {
      cancelled = true;
    };
  }, [isLoading, auth, api, selectedShopDisplayId]);

  const selectedScope = useMemo(
    () => (selectedShopDisplayId ? `vendor:${selectedShopDisplayId}` : undefined),
    [selectedShopDisplayId]
  );

  if (isLoading) {
    return <div>Loading auth...</div>;
  }

  if (!auth || auth.role !== "admin") {
    return null;
  }

  return (
    <div className="px-4 py-4">
      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">Manage Shop Products and Collections</h1>
        <p className="mt-1 text-sm text-slate-600">
          Select a shop and manage collection membership as an admin.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:max-w-md">
          <label className="text-sm font-medium text-slate-700" htmlFor="admin-shop-selector">
            Shop
          </label>
          <select
            id="admin-shop-selector"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={selectedShopDisplayId}
            onChange={(e) => setSelectedShopDisplayId(e.target.value)}
            disabled={loadingShops}
          >
            <option value="">Select shop</option>
            {shops
              .filter((s) => !!s.display_id)
              .map((s) => (
                <option key={s.id} value={s.display_id}>
                  {s.name} ({s.display_id})
                </option>
              ))}
          </select>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      {loadingShopData ? <div>Loading selected shop data...</div> : null}

      {!loadingShopData && shop && selectedScope ? (
        <div>
          <ShopDetailsPage shop={shop} products={products} scope={selectedScope} />
          <ProductActionsSidebar scope={selectedScope} />
        </div>
      ) : null}
    </div>
  );
}
