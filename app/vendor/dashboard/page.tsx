"use client";

import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import CollectionForm from "@/components/Collections/CollectionForm";
import VendorCollectionsList from "@/components/Collections/VendorCollectionsList";

export default function ShopDashboard() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();
  const [shopStatus, setShopStatus] = React.useState<{ approved: boolean; name?: string } | null>(null);

  React.useEffect(() => {
    if (!isLoading && !auth) {
      router.push("/auth/login");
      return;
    }
    if (!isLoading && auth && auth.role !== "shop_owner") {
      router.push("/");
    }
  }, [auth, isLoading, router]);

  // Fetch authoritative shop status from backend rather than relying on token
  React.useEffect(() => {
    const loadStatus = async () => {
      if (auth && auth.shop_display_id) {
        try {
          const res = await api.shops.getStatus({ display_id: auth.shop_display_id });
          setShopStatus({ approved: !!res.approved, name: res.name });
        } catch (e) {
          // ignore — keep showing local auth state
        }
      }
    };
    loadStatus();
  }, [auth]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!auth) {
    return null;
  }

  if (auth.role !== "shop_owner") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Shop Dashboard</h1>
          <p className="mt-2 text-lg text-slate-600">
            Welcome, <strong>{auth.shop_name}</strong>
          </p>
        </div>

        {/* Approval Status */}
        {!(shopStatus?.approved ?? false) && (
          <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              ⏳ <strong>Pending Approval:</strong> Your shop is pending admin approval. Once
              approved, you'll be able to add products and manage your shop.
            </p>
          </div>
        )}

        {/* Available Actions */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Add Products */}
          {shopStatus?.approved ?? false ? (
            <Link href="/vendor/products/add">
              <div className="cursor-pointer rounded-lg border border-slate-300 bg-white p-6 shadow-sm transition hover:shadow-md">
                <h2 className="text-xl font-bold text-slate-900">Add Product</h2>
                <p className="mt-2 text-slate-600">Create and list new products in your shop</p>
                <p className="mt-4 text-sm font-semibold text-slate-900 flex items-center">Get Started →</p>
              </div>
            </Link>
          ) : (
            <div className="rounded-lg border border-slate-300 bg-white p-6 opacity-60">
              <h2 className="text-xl font-bold text-slate-900">Add Product</h2>
              <p className="mt-2 text-slate-600">Create and list new products in your shop</p>
              <p className="mt-4 text-sm text-slate-500">Available after approval</p>
            </div>
          )}

          {/* Manage Products */}
          {shopStatus?.approved ?? false ? (
            <Link href="/vendor/products">
              <div className="cursor-pointer rounded-lg border border-slate-300 bg-white p-6 shadow-sm transition hover:shadow-md">
                <h2 className="text-xl font-bold text-slate-900">Manage Products</h2>
                <p className="mt-2 text-slate-600">View, edit, and manage your existing products</p>
                <p className="mt-4 text-sm font-semibold text-slate-900 flex items-center">View Products →</p>
              </div>
            </Link>
          ) : (
            <div className="rounded-lg border border-slate-300 bg-white p-6 opacity-60">
              <h2 className="text-xl font-bold text-slate-900">Manage Products</h2>
              <p className="mt-2 text-slate-600">View, edit, and manage your existing products</p>
              <p className="mt-4 text-sm text-slate-500">Available after approval</p>
            </div>
          )}

          {/* Shop Settings */}
          <Link href="/vendor">
            <div className="cursor-pointer rounded-lg border border-slate-300 bg-white p-6 shadow-sm transition hover:shadow-md">
              <h2 className="text-xl font-bold text-slate-900">Shop Settings</h2>
              <p className="mt-2 text-slate-600">
                Update your shop information and preferences
              </p>
              <p className="mt-4 text-sm font-semibold text-slate-900 flex items-center">
                Go to Settings →
              </p>
            </div>
          </Link>

          {/* Analytics */}
          <Link href="/vendor">
            <div className="cursor-pointer rounded-lg border border-slate-300 bg-white p-6 shadow-sm transition hover:shadow-md">
              <h2 className="text-xl font-bold text-slate-900">Analytics</h2>
              <p className="mt-2 text-slate-600">
                View sales, traffic, and other shop statistics
              </p>
              <p className="mt-4 text-sm font-semibold text-slate-900 flex items-center">
                View Analytics →
              </p>
            </div>
          </Link>
        </div>

        {/* Shop Info */}
        <div className="mt-12 rounded-lg border border-slate-300 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Shop Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-600">Shop Name</p>
              <p className="text-lg font-semibold text-slate-900">{auth.shop_name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Email</p>
              <p className="text-lg font-semibold text-slate-900">{auth.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <p className={`text-lg font-semibold ${shopStatus?.approved ? 'text-green-600' : 'text-yellow-600'}`}>
                {shopStatus?.approved ? "Approved" : "Pending Approval"}
              </p>
            </div>
          </div>
        </div>
        {/* Collections */}
        <div className="mt-8 rounded-lg border border-slate-300 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Collections</h2>
          <p className="text-sm text-slate-600 mb-4">Create and manage vendor-specific collections for your shop.</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <CollectionForm mode="create" vendorOnly shopDisplayId={auth?.shop_display_id} onSaved={() => { /* could refresh a list */ }} />
            </div>
            <div>
              <VendorCollectionsList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
