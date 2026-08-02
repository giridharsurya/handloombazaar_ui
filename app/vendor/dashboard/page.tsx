"use client";

import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import ShopEditableFields, { ShopEditableValues } from "@/components/Shop/ShopEditableFields";

export default function ShopDashboard() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();
  const [shopStatus, setShopStatus] = React.useState<{ approved: boolean; name?: string } | null>(null);
  const [shopForm, setShopForm] = React.useState<ShopEditableValues | null>(null);
  const [isSavingShop, setIsSavingShop] = React.useState(false);
  const [shopFormFeedback, setShopFormFeedback] = React.useState<string>("");

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

  React.useEffect(() => {
    const loadShopForm = async () => {
      if (!auth?.shop_display_id) return;
      try {
        const detail = await api.shops.getManageDetail({ display_id: auth.shop_display_id });
        setShopForm({
          name: detail.name || "",
          email: detail.email || "",
          year_established: String(detail.year_established || ""),
          address: detail.address || "",
          phone_number: detail.phone_number || "",
          website_url: detail.website_url || "",
          youtube_url: detail.youtube_url || "",
          instagram_url: detail.instagram_url || "",
          facebook_url: detail.facebook_url || "",
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load shop details";
        setShopFormFeedback(message);
      }
    };
    loadShopForm();
  }, [auth?.shop_display_id]);

  const handleShopFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShopForm((prev) => (prev ? { ...prev, [name]: value } : prev));
    setShopFormFeedback("");
  };

  const handleSaveShopDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth?.shop_display_id || !shopForm) return;

    const parsedYear = Number.parseInt(shopForm.year_established, 10);
    if (!shopForm.name.trim()) {
      setShopFormFeedback("Shop name is required.");
      return;
    }
    if (!shopForm.email.trim() || !shopForm.email.includes("@")) {
      setShopFormFeedback("Valid email is required.");
      return;
    }
    if (Number.isNaN(parsedYear) || parsedYear < 1800 || parsedYear > 2100) {
      setShopFormFeedback("Year established must be between 1800 and 2100.");
      return;
    }
    if (!shopForm.address.trim()) {
      setShopFormFeedback("Address is required.");
      return;
    }
    if (!shopForm.phone_number.trim()) {
      setShopFormFeedback("Phone number is required.");
      return;
    }

    setIsSavingShop(true);
    setShopFormFeedback("");
    try {
      const updated = await api.shops.update(auth.shop_display_id, {
        name: shopForm.name.trim(),
        email: shopForm.email.trim(),
        year_established: parsedYear,
        address: shopForm.address.trim(),
        phone_number: shopForm.phone_number.trim(),
        website_url: shopForm.website_url.trim() || null,
        youtube_url: shopForm.youtube_url.trim() || null,
        instagram_url: shopForm.instagram_url.trim() || null,
        facebook_url: shopForm.facebook_url.trim() || null,
      });

      setShopForm({
        name: updated.name || "",
        email: updated.email || "",
        year_established: String(updated.year_established || ""),
        address: updated.address || "",
        phone_number: updated.phone_number || "",
        website_url: updated.website_url || "",
        youtube_url: updated.youtube_url || "",
        instagram_url: updated.instagram_url || "",
        facebook_url: updated.facebook_url || "",
      });
      setShopStatus((prev) => ({ approved: prev?.approved ?? false, name: updated.name }));
      setShopFormFeedback("Shop details updated successfully.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update shop details";
      setShopFormFeedback(message);
    } finally {
      setIsSavingShop(false);
    }
  };

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
            Welcome, <strong>{shopForm?.name || shopStatus?.name || auth.shop_name}</strong>
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

          {/* Shop Settings */}
          <Link href="/vendor/settings">
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
          {/* Collections (vendor) */}
          <Link href="/vendor/collections">
            <div className="cursor-pointer rounded-lg border border-slate-300 bg-white p-6 shadow-sm transition hover:shadow-md">
              <h2 className="text-xl font-bold text-slate-900">Collections</h2>
              <p className="mt-2 text-slate-600">Create and manage your shop collections</p>
              <p className="mt-4 text-sm font-semibold text-slate-900 flex items-center">Manage Collections →</p>
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

        {/* Collections moved to dedicated page: /vendor/collections */}
      </div>
    </div>
  );
}
