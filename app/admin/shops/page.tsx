"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/ApiProvider";
import { useAuth } from "@/lib/AuthContext";

type Shop = {
  id: number;
  name: string;
  display_id?: string;
  email?: string;
  is_active?: boolean;
  created_at?: string;
};

export default function AdminShopsPage() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();
  const api = useApi();

  const [shops, setShops] = useState<Shop[]>([]);
  const [pendingShops, setPendingShops] = useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState<boolean>(false);
  const [shopsFeedback, setShopsFeedback] = useState<string>("");

  useEffect(() => {
    if (isLoading) return;
    if (!auth) {
      router.push("/auth/login");
      return;
    }
    if (auth.role !== "admin") {
      router.push("/");
    }
  }, [auth, isLoading, router]);

  const loadShopsData = async () => {
    setIsLoadingShops(true);
    setShopsFeedback("");

    try {
      const [allShops, pending] = await Promise.all([api.admin.getShops(), api.admin.getPendingShops()]);
      setShops(allShops);
      setPendingShops(pending);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load shops";
      setShopsFeedback(message);
    } finally {
      setIsLoadingShops(false);
    }
  };

  useEffect(() => {
    if (isLoading || !auth || auth.role !== "admin") return;
    loadShopsData();
  }, [isLoading, auth]);

  const handleShopDecision = async (shopId: number, action: "approve" | "reject") => {
    setShopsFeedback("");

    try {
      await api.admin.shopDecision(shopId, action);
      await loadShopsData();
      setShopsFeedback(action === "approve" ? "Shop approved successfully." : "Shop rejected successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update shop status";
      setShopsFeedback(message);
    }
  };

  if (isLoading) return null;
  if (!auth || auth.role !== "admin") return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">Manage Shops</h1>
              <p className="mt-1 text-sm text-slate-600">Approve shops to activate them, or reject to keep them inactive.</p>
            </div>
            <button
              type="button"
              onClick={loadShopsData}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 text-sm text-slate-600">Total shops: {shops.length}</div>

          {isLoadingShops ? <p className="mt-4 text-sm text-slate-600">Loading shops...</p> : null}

          {!isLoadingShops && pendingShops.length === 0 ? <p className="mt-4 text-sm text-slate-600">No pending shops found.</p> : null}

          {pendingShops.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="px-3 py-2 font-medium">Shop</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Created</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingShops.map((pendingShop) => (
                    <tr key={pendingShop.id} className="border-b border-slate-100">
                      <td className="px-3 py-3">{pendingShop.name}</td>
                      <td className="px-3 py-3">{pendingShop.email}</td>
                      <td className="px-3 py-3">{pendingShop.created_at ? new Date(pendingShop.created_at).toLocaleString() : "-"}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleShopDecision(pendingShop.id, "approve")}
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShopDecision(pendingShop.id, "reject")}
                            className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {shopsFeedback ? <p className="mt-4 text-sm text-slate-700">{shopsFeedback}</p> : null}
        </section>
      </div>
    </main>
  );
}
