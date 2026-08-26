"use client";

import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ShopEditableFields, { ShopEditableValues } from "@/components/Shop/ShopEditableFields";
import ShopLogoUploadField from "@/components/Shop/ShopLogoUploadField";

export default function VendorSettingsPage() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();
  const [shopForm, setShopForm] = React.useState<ShopEditableValues | null>(null);
  const [shopLogoFile, setShopLogoFile] = React.useState<File | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = React.useState<string | null>(null);
  const [isSavingShop, setIsSavingShop] = React.useState(false);
  const [shopFormFeedback, setShopFormFeedback] = React.useState<string>("");
  const [isValidatingSlug, setIsValidatingSlug] = React.useState(false);
  const [slugValidationMessage, setSlugValidationMessage] = React.useState<string | null>(null);
  const [slugValidated, setSlugValidated] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !auth) {
      router.push("/auth/login");
      return;
    }
    if (!isLoading && auth && auth.role !== "shop_owner") {
      router.push("/");
    }
  }, [auth, isLoading, router]);

  React.useEffect(() => {
    const loadShopForm = async () => {
      if (!auth?.shop_display_id) return;
      try {
        const detail = await api.shops.getManageDetail({ display_id: auth.shop_display_id });
        setShopForm({
          name: detail.name || "",
          email: detail.email || "",
          shop_slug: detail.shop_slug || "",
          description: detail.description || "",
          year_established: String(detail.year_established || ""),
          address: detail.address || "",
          city: detail.city || "",
          phone_number: detail.phone_number || "",
          website_url: detail.website_url || "",
          youtube_url: detail.youtube_url || "",
          instagram_url: detail.instagram_url || "",
          facebook_url: detail.facebook_url || "",
        });
        setCurrentLogoUrl(detail.shop_logo_url || null);
        setShopLogoFile(null);
        setSlugValidated(Boolean(detail.shop_slug && detail.shop_slug.trim().length > 0));
        setSlugValidationMessage(detail.shop_slug ? "Current slug is already saved and accepted." : "No slug saved yet. You can leave this blank.");
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
    if (name === "shop_slug") {
      setSlugValidationMessage(value.trim() ? "Slug changed. Please validate again before saving." : "Shop slug is required before saving.");
      setSlugValidated(false);
    }
    setShopFormFeedback("");
  };

  const handleValidateShopSlug = async () => {
    if (!shopForm) return;
    const candidate = shopForm.shop_slug.trim();
    if (!candidate) {
      setSlugValidationMessage("Shop slug is required before saving.");
      setSlugValidated(false);
      return;
    }

    setIsValidatingSlug(true);
    setShopFormFeedback("");
    try {
      const response = await api.shops.validateSlug(candidate, auth?.shop_display_id);
      setSlugValidationMessage(response.message || "Shop URL slug is available.");
      setSlugValidated(Boolean(response.valid));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to validate shop slug.";
      setSlugValidationMessage(message);
      setSlugValidated(false);
    } finally {
      setIsValidatingSlug(false);
    }
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
    if (!shopForm.shop_slug.trim()) {
      setShopFormFeedback("Shop slug is required before saving.");
      return;
    }
    if (!slugValidated) {
      setShopFormFeedback("Please validate the shop slug before saving.");
      return;
    }

    setIsSavingShop(true);
    setShopFormFeedback("");

    try {
      await api.shops.update(auth.shop_display_id, {
        name: shopForm.name.trim(),
        email: shopForm.email.trim(),
        shop_slug: shopForm.shop_slug.trim(),
        description: shopForm.description.trim() || null,
        year_established: parsedYear,
        address: shopForm.address.trim(),
        city: shopForm.city.trim(),
        phone_number: shopForm.phone_number.trim(),
        website_url: shopForm.website_url.trim() || null,
        youtube_url: shopForm.youtube_url.trim() || null,
        instagram_url: shopForm.instagram_url.trim() || null,
        facebook_url: shopForm.facebook_url.trim() || null,
      });

      if (shopLogoFile) {
        const logoUpdated = await api.shops.updateLogo(auth.shop_display_id, shopLogoFile);
        setCurrentLogoUrl(logoUpdated.shop_logo_url || null);
        setShopLogoFile(null);
      }

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

  if (!auth || auth.role !== "shop_owner") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Shop Settings</h1>
          <p className="mt-2 text-sm text-slate-600">Update your shop profile information here.</p>
        </div>

        {shopForm ? (
          <form onSubmit={handleSaveShopDetails} className="space-y-4">
            <ShopEditableFields
              values={shopForm}
              onChange={handleShopFieldChange}
              onValidateSlug={handleValidateShopSlug}
              isValidatingSlug={isValidatingSlug}
              slugValidationMessage={slugValidationMessage}
              slugValidated={slugValidated}
              disabled={isSavingShop}
            />
            <ShopLogoUploadField
              inputId="shop_logo_update"
              label="Shop Logo"
              selectedFile={shopLogoFile}
              currentImageUrl={currentLogoUrl}
              disabled={isSavingShop}
              onFileChange={(file) => {
                setShopLogoFile(file);
                setShopFormFeedback("");
              }}
            />
            <button
              type="submit"
              disabled={isSavingShop}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {isSavingShop ? "Saving..." : "Save Shop Details"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-600">Loading editable shop details...</p>
        )}

        {shopFormFeedback ? <p className="mt-4 text-sm text-slate-700">{shopFormFeedback}</p> : null}
      </div>
    </div>
  );
}
