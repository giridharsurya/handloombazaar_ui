"use client";

import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import type { ShopEditableValues } from "@/components/Shop/ShopEditableFields";

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
          city: detail.city || "",
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
    if (!shopForm.city.trim()) {
      setShopFormFeedback("City is required.");
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
        city: shopForm.city.trim(),
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
        city: updated.city || "",
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

  const isApproved = shopStatus?.approved ?? false;
  const cardBaseClass = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-150";
  const cardEnabledClass = "hover:shadow-md cursor-pointer";
  const cardDisabledClass = "opacity-60 cursor-not-allowed";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="sm:flex sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Vendor Dashboard</p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{shopForm?.name || shopStatus?.name || auth.shop_name}</h1>
              <p className="mt-2 text-sm text-slate-600">
                {isApproved
                  ? "Your shop is approved. You can manage your products, settings, and collections."
                  : "Your shop is pending approval. Dashboard actions are disabled until approval is complete."}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3 sm:mt-0">
              <Link href="/vendor" className={`inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white ${isApproved ? "hover:bg-slate-700" : "opacity-60 cursor-not-allowed"}`} aria-disabled={!isApproved}>
                Go to Vendor Page
              </Link>
            </div>
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium">
            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${isApproved ? "bg-emerald-500" : "bg-amber-500"}`} />
            {isApproved ? "Approved" : "Pending Approval"}
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {isApproved ? (
            <Link href="/vendor/products/add" className={`${cardBaseClass} ${cardEnabledClass}`}>
              <h2 className="text-xl font-semibold text-slate-900">Add Product</h2>
              <p className="mt-2 text-sm text-slate-600">Create and list new products in your shop.</p>
              <p className="mt-4 text-sm font-semibold text-slate-900">Get Started →</p>
            </Link>
          ) : (
            <div className={`${cardBaseClass} ${cardDisabledClass}`}>
              <h2 className="text-xl font-semibold text-slate-900">Add Product</h2>
              <p className="mt-2 text-sm text-slate-600">Create and list new products in your shop.</p>
              <p className="mt-4 text-sm text-slate-500">Available after approval</p>
            </div>
          )}

          <div className={`${cardBaseClass} ${isApproved ? cardEnabledClass : cardDisabledClass}`}>
            {isApproved ? (
              <Link href="/vendor/settings" className="block">
                <h2 className="text-xl font-semibold text-slate-900">Shop Settings</h2>
                <p className="mt-2 text-sm text-slate-600">Update your shop information and preferences.</p>
                <p className="mt-4 text-sm font-semibold text-slate-900">Go to Settings →</p>
              </Link>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-slate-900">Shop Settings</h2>
                <p className="mt-2 text-sm text-slate-600">Update your shop information and preferences.</p>
                <p className="mt-4 text-sm text-slate-500">Available after approval</p>
              </>
            )}
          </div>

          <div className={`${cardBaseClass} ${isApproved ? cardEnabledClass : cardDisabledClass}`}>
            {isApproved ? (
              <Link href="/vendor/collections" className="block">
                <h2 className="text-xl font-semibold text-slate-900">Collections</h2>
                <p className="mt-2 text-sm text-slate-600">Create and manage your shop collections.</p>
                <p className="mt-4 text-sm font-semibold text-slate-900">Manage Collections →</p>
              </Link>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-slate-900">Collections</h2>
                <p className="mt-2 text-sm text-slate-600">Create and manage your shop collections.</p>
                <p className="mt-4 text-sm text-slate-500">Available after approval</p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
