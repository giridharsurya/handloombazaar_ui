"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/ApiProvider";
import { useAuth } from "@/lib/AuthContext";
import ShopEditableFields, { ShopEditableValues } from "@/components/Shop/ShopEditableFields";
import ShopLogoUploadField from "@/components/Shop/ShopLogoUploadField";

type Shop = {
  id: number;
  name: string;
  display_id: string;
  email?: string;
  year_established?: number;
  address?: string;
  phone_number?: string;
  website_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  approved?: boolean;
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
  const [selectedShopDisplayId, setSelectedShopDisplayId] = useState<string>("");
  const [shopForm, setShopForm] = useState<ShopEditableValues | null>(null);
  const [shopLogoFile, setShopLogoFile] = useState<File | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [isLoadingShopForm, setIsLoadingShopForm] = useState<boolean>(false);
  const [isSavingShopForm, setIsSavingShopForm] = useState<boolean>(false);
  const [shopFormFeedback, setShopFormFeedback] = useState<string>("");

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

  useEffect(() => {
    const loadSelectedShop = async () => {
      if (!selectedShopDisplayId) {
        setShopForm(null);
        setShopLogoFile(null);
        setCurrentLogoUrl(null);
        setShopFormFeedback("");
        return;
      }

      setIsLoadingShopForm(true);
      setShopFormFeedback("");
      try {
        const detail = await api.shops.getManageDetail({ display_id: selectedShopDisplayId });
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
        setCurrentLogoUrl(detail.shop_logo_url || null);
        setShopLogoFile(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load shop details";
        setShopFormFeedback(message);
      } finally {
        setIsLoadingShopForm(false);
      }
    };

    loadSelectedShop();
  }, [selectedShopDisplayId, api.shops]);

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

  const handleShopFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShopForm((prev) => (prev ? { ...prev, [name]: value } : prev));
    setShopFormFeedback("");
  };

  const handleSaveShopDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedShopDisplayId || !shopForm) return;

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

    setIsSavingShopForm(true);
    setShopFormFeedback("");

    try {
      const updated = await api.shops.update(selectedShopDisplayId, {
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

      if (shopLogoFile) {
        const logoUpdated = await api.shops.updateLogo(selectedShopDisplayId, shopLogoFile);
        setCurrentLogoUrl(logoUpdated.shop_logo_url || null);
        setShopLogoFile(null);
      }

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
      setShopFormFeedback("Shop details updated successfully.");
      await loadShopsData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update shop details";
      setShopFormFeedback(message);
    } finally {
      setIsSavingShopForm(false);
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

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Update Shop Details</h2>
          <p className="mt-1 text-sm text-slate-600">Select any shop and update its profile information.</p>

          <div className="mt-4">
            <label htmlFor="shop-selector" className="block text-sm font-medium text-slate-700">
              Shop
            </label>
            <select
              id="shop-selector"
              value={selectedShopDisplayId}
              onChange={(e) => setSelectedShopDisplayId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="">Select a shop</option>
              {shops.map((row) => (
                <option key={row.id} value={row.display_id}>
                  {row.name} ({row.display_id})
                </option>
              ))}
            </select>
          </div>

          {isLoadingShopForm ? <p className="mt-4 text-sm text-slate-600">Loading shop details...</p> : null}

          {!isLoadingShopForm && shopForm ? (
            <form onSubmit={handleSaveShopDetails} className="mt-4 space-y-4">
              <ShopEditableFields values={shopForm} onChange={handleShopFieldChange} disabled={isSavingShopForm} />
              <ShopLogoUploadField
                inputId="admin_shop_logo_update"
                label="Shop Logo"
                selectedFile={shopLogoFile}
                currentImageUrl={currentLogoUrl}
                disabled={isSavingShopForm}
                onFileChange={(file) => {
                  setShopLogoFile(file);
                  setShopFormFeedback("");
                }}
              />
              <button
                type="submit"
                disabled={isSavingShopForm}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {isSavingShopForm ? "Saving..." : "Save Shop Details"}
              </button>
            </form>
          ) : null}

          {shopFormFeedback ? <p className="mt-4 text-sm text-slate-700">{shopFormFeedback}</p> : null}
        </section>
      </div>
    </main>
  );
}
