"use client";

import React, { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { useSelectionScope, useProductSelection } from "@/lib/productSelection";
import { useProductActions } from "@/lib/productActions";
import { useVariantSelection } from "@/lib/VariantSelectionContext";
import { useAuth } from "@/lib/AuthContext";
import type { ProductListItem, ProductFilterAttribute, BulkProductActionType } from "@/types/apiTypes";

type ActionMode = "view" | "add" | "delete";

export default function ProductActionsSidebar({ scope }: { scope?: string }) {
  const { auth } = useAuth();
  const resolvedScope = useSelectionScope(scope);
  const { allProducts, setAllProducts, applyViewForVendorCollection, applyViewForSystemCollection, confirmAction, setActionViewIds } = useProductActions();
  const selection = useProductSelection(resolvedScope);
  const { setVariantMode, clearVariantMode } = useVariantSelection();
  const [action, setAction] = useState<string>("");
  const [subtype, setSubtype] = useState<"system" | "vendor">("vendor");
  const [collections, setCollections] = useState<any[]>([]);
  const [vendorCollections, setVendorCollections] = useState<any[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [mode, setMode] = useState<ActionMode>("view");
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Variants state
  const [currentVariants, setCurrentVariants] = useState<ProductListItem[]>([]);
  const [variantCount, setVariantCount] = useState(0);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantMainProductId, setVariantMainProductId] = useState<string | null>(null);

  // Attributes bulk update state
  const [editableAttributes, setEditableAttributes] = useState<ProductFilterAttribute[]>([]);
  const [loadingEditableAttributes, setLoadingEditableAttributes] = useState(false);
  const [attributeUpdateByDefinition, setAttributeUpdateByDefinition] = useState<Record<number, string>>({});
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [priceChangePercent, setPriceChangePercent] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<string>("");
  const [quantityValue, setQuantityValue] = useState<string>("");
  // Announcement banner state
  const [bannerTitle, setBannerTitle] = useState<string>("");
  const [bannerSubtitle, setBannerSubtitle] = useState<string>("");
  const [bannerBgColor, setBannerBgColor] = useState<string>("#F43F5E");
  const [bannerTextColor, setBannerTextColor] = useState<string>("#FFFFFF");
  const [bannerIsActive, setBannerIsActive] = useState<boolean>(true);
  const [bannerLoading, setBannerLoading] = useState<boolean>(false);

  const REMOVE_ATTRIBUTE_VALUE = "__remove__";

  const bulkActionModes = new Set([
    "bulk-set-active",
    "bulk-set-inactive",
    "bulk-change-price",
    "bulk-set-discount",
    "bulk-delete",
    "bulk-quantity",
  ]);

  const shopId = resolvedScope && resolvedScope.startsWith("vendor:") ? resolvedScope.split(":")[1] : undefined;
  const isAdminUser = auth?.role === "admin";

  // Keep the main product fixed while in variants mode.
  const mainProduct = useMemo(() => {
    if (action === "variants" && variantMainProductId) {
      return allProducts?.find((p) => p.display_id === variantMainProductId) || null;
    }
    return null;
  }, [action, variantMainProductId, allProducts]);

  const selectedProducts = useMemo(() => {
    const selectedSet = new Set(selection.selectedIds);
    return (allProducts || []).filter((p) => selectedSet.has(p.display_id));
  }, [allProducts, JSON.stringify(selection.selectedIds)]);

  const hasMixedShopSelection = useMemo(() => {
    const shopSet = new Set(selectedProducts.map((p) => p.shop_display_id));
    return shopSet.size > 1;
  }, [selectedProducts]);

  useEffect(() => {
    // Entering variants mode should preserve selection and lock the current product as main.
    if (action === "variants") {
      setSelectedCollectionId(null);
      setActionViewIds(null);

      if (selection.selectedIds.length === 0) {
        setVariantMainProductId(null);
        setCurrentVariants([]);
        setVariantCount(0);
        return;
      }

      if (!variantMainProductId || !selection.selectedIds.includes(variantMainProductId)) {
        setVariantMainProductId(selection.selectedIds[selection.selectedIds.length - 1]);
      }
      return;
    }

    if (action === "attributes") {
      setSelectedCollectionId(null);
      setActionViewIds(null);
      return;
    }

    if (action === "banners") {
      setSelectedCollectionId(null);
      setActionViewIds(null);
      selection.clear();
      return;
    }

    if (bulkActionModes.has(action)) {
      setSelectedCollectionId(null);
      setActionViewIds(null);
      return;
    }

    // Leaving variants mode: clear pinned main and variant preview state.
    if (variantMainProductId) {
      setVariantMainProductId(null);
      setCurrentVariants([]);
      setVariantCount(0);
    }

    // Non-collection modes should clear collection view/selection state.
    if (action !== "collections") {
      setSelectedCollectionId(null);
      setActionViewIds(null);
      selection.clear();
    }
  }, [action, setActionViewIds]);

  useEffect(() => {
    if (action !== "attributes") return;

    const loadAttributes = async () => {
      setLoadingEditableAttributes(true);
      try {
        const attrs = await api.products.getEditableAttributes({ authenticated: true });
        setEditableAttributes(attrs || []);
      } catch (e: any) {
        setMessage({ type: "error", text: e?.message || "Failed to load attributes" });
        setTimeout(() => setMessage(null), 4000);
      } finally {
        setLoadingEditableAttributes(false);
      }
    };

    loadAttributes();
  }, [action]);

  useEffect(() => {
    if (action === "variants" && variantMainProductId) {
      loadVariantsForProduct(variantMainProductId);
    }
  }, [action, variantMainProductId]);

  // Update variant selection context
  useEffect(() => {
    if (action === "variants" && mainProduct) {
      const variantIds = new Set(
        selection.selectedIds.filter((id) => id !== mainProduct.display_id)
      );
      setVariantMode(true, mainProduct.display_id, variantIds);
    } else {
      clearVariantMode();
    }
  }, [action, mainProduct, JSON.stringify(selection.selectedIds), setVariantMode, clearVariantMode]);

  useEffect(() => {
    if (!isAdminUser) {
      setSubtype("vendor");
      return;
    }

    // In admin-wide contexts without a concrete vendor scope, default to system actions.
    if (resolvedScope === "admin") {
      setSubtype("system");
    }
  }, [isAdminUser, resolvedScope]);

  useEffect(() => {
    const loadSystem = async () => {
      try {
        const data = await api.collections.list({
          kind: "system",
          shop_display_id: isAdminUser ? undefined : shopId,
          authenticated: isAdminUser ? true : !!shopId,
        });
        setCollections(data || []);
      } catch (e) {
        setCollections([]);
      }
    };

    const loadVendor = async () => {
      if (!shopId) return setVendorCollections([]);
      try {
        const data = await api.collections.list({ kind: "shop", shop_display_id: shopId, authenticated: true });
        setVendorCollections(data || []);
      } catch (e) {
        setVendorCollections([]);
      }
    };

    loadSystem();
    // invoke vendor loader
    (async () => { await loadVendor(); })();
  }, [shopId, isAdminUser]);

  useEffect(() => {
    if (action !== "banners" || !selectedCollectionId) return;

    const loadExistingBanner = async () => {
      setBannerLoading(true);
      try {
        const banner = await api.announcements.getByCollection(selectedCollectionId, {
          shop_display_id: subtype === "vendor" ? shopId : undefined,
        });

        if (banner) {
          setBannerTitle(banner.title || "");
          setBannerSubtitle(banner.subtitle || "");
          setBannerBgColor(banner.background_color || "#F43F5E");
          setBannerTextColor(banner.text_color || "#FFFFFF");
          setBannerIsActive(!!banner.is_active);
        } else {
          const sourceCollection = (subtype === "vendor" ? vendorCollections : collections).find((c) => c.id === selectedCollectionId);
          setBannerTitle(sourceCollection?.name || "");
          setBannerSubtitle("");
          setBannerBgColor("#F43F5E");
          setBannerTextColor("#FFFFFF");
          setBannerIsActive(true);
        }
      } catch (e: any) {
        setMessage({ type: "error", text: e?.message || "Failed to load banner" });
        setTimeout(() => setMessage(null), 3500);
      } finally {
        setBannerLoading(false);
      }
    };

    loadExistingBanner();
  }, [action, selectedCollectionId, subtype, shopId, JSON.stringify(vendorCollections), JSON.stringify(collections)]);

  // Fetch relevant products for the selected collection depending on mode.
  const fetchCollection = async () => {
    if (!selectedCollectionId) return;
    try {
      if (subtype === "vendor") {
        await applyViewForVendorCollection(shopId, selectedCollectionId, mode === "view" ? "view" : mode);
      } else {
        await applyViewForSystemCollection(selectedCollectionId, mode === "view" ? "view" : mode);
      }
    } catch (e) {
      // ignore — provider already handles nulling view ids
    }
  };

  const fetchFor = async (collectionId: number | null, m: ActionMode) => {
    if (!collectionId) return;
    // mode changes should start with fresh selection state
    selection.clear();
    setMode(m);
    try {
      if (subtype === "vendor") {
        await applyViewForVendorCollection(shopId, collectionId, m === "view" ? "view" : m);
      } else {
        await applyViewForSystemCollection(collectionId, m === "view" ? "view" : m);
      }
    } catch (e) {
      // ignore
    }
  };

  const resetView = async () => {
    setMode("view");
    // fetch collection products in view mode
    await fetchCollection();
  };

  const confirmActionLocal = async () => {
    const passMode = mode === "view" ? undefined : mode;
    try {
      const res = await confirmAction({ subtype, shopId, collectionId: selectedCollectionId ?? undefined, mode: passMode as any, selectedIds: selection.selectedIds });
      selection.clear();
      // show feedback
      if (res && (res.added || res.removed)) {
        const parts: string[] = [];
        if (res.added) parts.push(`${res.added} added`);
        if (res.removed) parts.push(`${res.removed} removed`);
        if (res.blocked_by_constraints) parts.push(`${res.blocked_by_constraints} blocked by constraints`);
        setMessage({ type: "success", text: `Products updated: ${parts.join(", ")}` });
      } else {
        setMessage({ type: "success", text: `Action completed` });
      }
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Failed to perform action" });
      setTimeout(() => setMessage(null), 4000);
    }

    // refresh vendor collections listing
    try {
      const data = await api.collections.list({ kind: "shop", shop_display_id: shopId, authenticated: true });
      setVendorCollections(data || []);
    } catch (e) {}

    // re-fetch collection members (view mode) so added products appear
    if (selectedCollectionId) {
      await fetchFor(selectedCollectionId, "view");
    } else {
      setActionViewIds(null);
    }
  };

  // Variants handler
  const loadVariantsForProduct = async (productDisplayId: string) => {
    setLoadingVariants(true);
    try {
      const variants = await api.products.getProductVariants(productDisplayId, { authenticated: true });
      const variantsList = variants.data || [];
      setCurrentVariants(variantsList);
      setVariantCount(variantsList.length);

      // Keep main product selected and deterministically select existing variants.
      const ids = [productDisplayId, ...variantsList.map((v) => v.display_id)];
      selection.selectAll(Array.from(new Set(ids)));
    } catch (e) {
      setMessage({ type: "error", text: "Failed to load variants" });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setLoadingVariants(false);
    }
  };

  const updateVariants = async () => {
    if (!mainProduct) return;

    setLoadingVariants(true);
    try {
      // Get all currently selected variant IDs (excluding the main product)
      const variantDisplayIds = selection.selectedIds.filter((id) => id !== mainProduct.display_id);

      // Call the backend endpoint to update variants
      // Backend will create the product_group if needed and handle all updates
      await api.products.updateProductVariants(mainProduct.display_id, variantDisplayIds);

      // Reload variants to confirm
      const updatedVariants = await api.products.getProductVariants(mainProduct.display_id, { authenticated: true });
      const variantsList = updatedVariants.data || [];
      setCurrentVariants(variantsList);
      setVariantCount(variantsList.length);

      setMessage({ type: "success", text: `Variants updated successfully (${variantsList.length} variants)` });
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Failed to update variants" });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setLoadingVariants(false);
    }
  };

  const updateAttributesForSelectedProducts = async () => {
    if (selection.selectedIds.length === 0) {
      setMessage({ type: "error", text: "Select at least one product" });
      setTimeout(() => setMessage(null), 3500);
      return;
    }

    if (hasMixedShopSelection) {
      setMessage({ type: "error", text: "Selected products must belong to the same shop" });
      setTimeout(() => setMessage(null), 4000);
      return;
    }

    const updates = Object.entries(attributeUpdateByDefinition)
      .filter(([, value]) => value && value.trim().length > 0)
      .map(([definitionId, value]) => {
        if (value === REMOVE_ATTRIBUTE_VALUE) {
          return { definition_id: Number(definitionId), remove: true };
        }
        return { definition_id: Number(definitionId), option_id: Number(value) };
      });

    if (updates.length === 0) {
      setMessage({ type: "error", text: "Choose at least one attribute change" });
      setTimeout(() => setMessage(null), 3500);
      return;
    }

    setLoadingEditableAttributes(true);
    try {
      const result = await api.products.bulkUpdateAttributes({
        product_display_ids: selection.selectedIds,
        updates,
      });

      setMessage({
        type: "success",
        text: `${result.updated_count} product(s) updated successfully`,
      });
      setTimeout(() => setMessage(null), 3500);
      setAttributeUpdateByDefinition({});
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Failed to update attributes" });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setLoadingEditableAttributes(false);
    }
  };

  const runBulkProductAction = async (mode: BulkProductActionType) => {
    if (selection.selectedIds.length === 0) {
      setMessage({ type: "error", text: "Select at least one product" });
      setTimeout(() => setMessage(null), 3500);
      return;
    }

    if (hasMixedShopSelection) {
      setMessage({ type: "error", text: "Selected products must belong to the same shop" });
      setTimeout(() => setMessage(null), 4000);
      return;
    }

    const payload: any = {
      product_display_ids: selection.selectedIds,
      action: mode,
    };

    if (mode === "change_price_percent") {
      const parsed = Number(priceChangePercent);
      if (!Number.isFinite(parsed) || parsed < -100) {
        setMessage({ type: "error", text: "Enter a valid price change % (>= -100). Use negative to reduce, positive to increase." });
        setTimeout(() => setMessage(null), 3500);
        return;
      }
      payload.percentage = parsed;
    }

    if (mode === "set_discount_percent") {
      const parsed = Number(discountPercent);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
        setMessage({ type: "error", text: "Enter a valid final discount % between 0 and 100" });
        setTimeout(() => setMessage(null), 3500);
        return;
      }
      payload.percentage = parsed;
    }

    if (mode === "set_quantity") {
      const parsed = Number(quantityValue);
      if (!Number.isInteger(parsed) || parsed < 0) {
        setMessage({ type: "error", text: "Enter a valid non-negative quantity" });
        setTimeout(() => setMessage(null), 3500);
        return;
      }
      payload.quantity = parsed;
    }

    setBulkActionLoading(true);
    try {
      const result = await api.products.bulkProductAction(payload);

      if (mode === "delete_products") {
        const selectedSet = new Set(selection.selectedIds);
        setAllProducts((prev) => (prev || []).filter((p) => !selectedSet.has(p.display_id)));
        selection.clear();
      }

      setMessage({ type: "success", text: `${result.affected_count} product(s) updated` });
      setTimeout(() => setMessage(null), 3500);
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Failed to apply bulk action" });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const saveBanner = async () => {
    if (!selectedCollectionId) {
      setMessage({ type: "error", text: "Select a collection first" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const effectiveTitle = bannerTitle.trim();
    if (!effectiveTitle) {
      setMessage({ type: "error", text: "Banner title is required" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setBannerLoading(true);
    try {
      await api.announcements.upsert({
        collection_id: selectedCollectionId,
        title: effectiveTitle,
        subtitle: bannerSubtitle.trim() || undefined,
        background_color: bannerBgColor,
        text_color: bannerTextColor,
        is_active: bannerIsActive,
        shop_display_id: subtype === "vendor" ? shopId : undefined,
      });

      setMessage({ type: "success", text: "Banner saved" });
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Failed to save banner" });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setBannerLoading(false);
    }
  };

  const removeBanner = async () => {
    if (!selectedCollectionId) {
      setMessage({ type: "error", text: "Select a collection first" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setBannerLoading(true);
    try {
      await api.announcements.deleteByCollection(selectedCollectionId, {
        shop_display_id: subtype === "vendor" ? shopId : undefined,
      });
      setMessage({ type: "success", text: "Banner removed" });
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "Failed to remove banner" });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setBannerLoading(false);
    }
  };

  return (
    <aside className="w-64 shrink-0 sticky top-[calc(var(--app-header-height,120px)+var(--filter-header-height,72px))] self-start">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 h-fit border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Actions</h3>
        
        <div className="mb-8 border-t border-gray-200 pt-4 dark:border-gray-700">
          <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block">Action</label>
          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white dark:bg-gray-800 bg-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">Select action</option>
            <option value="collections">Collections</option>
            <option value="banners">Create Banner</option>
            <option value="variants">Select Variants</option>
            <option value="attributes">Update Attributes</option>
            <option value="bulk-set-active">Set Active</option>
            <option value="bulk-set-inactive">Set Inactive</option>
            <option value="bulk-change-price">Change Price %</option>
            <option value="bulk-set-discount">Set Discount %</option>
            <option value="bulk-quantity">Change Quantity</option>
            <option value="bulk-delete">Delete Products</option>
          </select>
        </div>

        {action === "collections" && (
          <div>
            <div className="mb-8 border-t border-gray-200 pt-4 dark:border-gray-700">
              <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block">Collection Type</label>
              <div className="flex gap-2">
                <button className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${subtype === "vendor" ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"}`} onClick={() => setSubtype("vendor")}>My Collections</button>
                <button className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${subtype === "system" ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"}`} onClick={() => setSubtype("system")}>System Collections</button>
              </div>
            </div>

            <div className="mb-8 border-t border-gray-200 pt-4 dark:border-gray-700">
              <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block">Select Collection</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white dark:bg-gray-800 bg-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                value={selectedCollectionId ?? ""}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  setSelectedCollectionId(id);
                  selection.clear();
                  // when selecting a collection, default to view mode and fetch members
                  if (id) fetchFor(id, "view");
                  else setActionViewIds(null);
                }}
              >
                <option value="">Choose collection</option>
                {(subtype === "vendor" ? vendorCollections : collections).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-8 border-t border-gray-200 pt-4 dark:border-gray-700">
              <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block">Mode</label>
              <div className="flex gap-2 mb-4">
                <button
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${mode === "add" ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"}`}
                  onClick={() => fetchFor(selectedCollectionId, "add")}
                  disabled={!selectedCollectionId}
                >
                  Add
                </button>
                <button
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${mode === "delete" ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"}`}
                  onClick={() => fetchFor(selectedCollectionId, "delete")}
                  disabled={!selectedCollectionId}
                >
                  Delete
                </button>
                <button
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${mode === "view" ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"}`}
                  onClick={async () => {
                    setMode("view");
                    if (selectedCollectionId) await fetchFor(selectedCollectionId, "view");
                    else setActionViewIds(null);
                  }}
                >
                  View
                </button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Selected: <span className="font-semibold">{selection.count}</span>
              </div>
            </div>

            <button 
              className="w-full px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={confirmActionLocal} 
              disabled={!selectedCollectionId || selection.count===0}
            >
              Confirm
            </button>
            
            {message ? (
              <div className={`mt-4 p-3 rounded-md text-sm font-medium ${message.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300"}`}>{message.text}</div>
            ) : null}
          </div>
        )}

        {action === "banners" && (
          <div>
            <div className="mb-8 border-t border-gray-200 pt-4 dark:border-gray-700">
              <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block">Collection Type</label>
              <div className="flex gap-2">
                <button
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${subtype === "vendor" ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                  onClick={() => setSubtype("vendor")}
                >
                  Shop Collections
                </button>
                {isAdminUser ? (
                  <button
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${subtype === "system" ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                    onClick={() => setSubtype("system")}
                  >
                    System Collections
                  </button>
                ) : null}
              </div>
              {!isAdminUser ? (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Vendors can create banners only from their shop collections.</p>
              ) : null}
            </div>

            <div className="mb-6 border-t border-gray-200 pt-4 dark:border-gray-700">
              <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block">Select Collection</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white dark:bg-gray-800 bg-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                value={selectedCollectionId ?? ""}
                onChange={(e) => setSelectedCollectionId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Choose collection</option>
                {(subtype === "vendor" ? vendorCollections : collections).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-6 border-t border-gray-200 pt-4 dark:border-gray-700">
              <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">Banner Text</label>
              <input
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white dark:bg-gray-800 bg-white"
                placeholder="Flat 10% off on Cotton Sarees"
              />

              <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 mt-4 block">Subtext</label>
              <input
                value={bannerSubtitle}
                onChange={(e) => setBannerSubtitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white dark:bg-gray-800 bg-white"
                placeholder="Limited period offer"
              />

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-900 dark:text-white block mb-1">Background</label>
                  <input type="color" value={bannerBgColor} onChange={(e) => setBannerBgColor(e.target.value)} className="h-10 w-full rounded border border-gray-300 dark:border-gray-600" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-900 dark:text-white block mb-1">Text Color</label>
                  <input type="color" value={bannerTextColor} onChange={(e) => setBannerTextColor(e.target.value)} className="h-10 w-full rounded border border-gray-300 dark:border-gray-600" />
                </div>
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={bannerIsActive} onChange={(e) => setBannerIsActive(e.target.checked)} />
                Banner active
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={saveBanner}
                disabled={bannerLoading || !selectedCollectionId}
                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bannerLoading ? "Saving..." : "Save Banner"}
              </button>
              <button
                onClick={removeBanner}
                disabled={bannerLoading || !selectedCollectionId}
                className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove Banner
              </button>
            </div>

            {message ? (
              <div className={`mt-4 p-3 rounded-md text-sm font-medium ${message.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300"}`}>{message.text}</div>
            ) : null}
          </div>
        )}

        {bulkActionModes.has(action) && (
          <div>
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">Selected Products</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{selection.selectedIds.length} selected</p>
            </div>

            {hasMixedShopSelection ? (
              <div className="mb-6 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-md">
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Selected products must be from the same shop</p>
              </div>
            ) : null}

            {action === "bulk-change-price" && (
              <div className="mb-6 border-t border-gray-200 pt-4 dark:border-gray-700">
                <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">Change Price Percentage</label>
                <input
                  type="number"
                  step="0.01"
                  value={priceChangePercent}
                  onChange={(e) => setPriceChangePercent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white dark:bg-gray-800 bg-white"
                  placeholder="e.g. -10 or 12.5"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Negative reduces, positive increases.</p>
              </div>
            )}

            {action === "bulk-set-discount" && (
              <div className="mb-6 border-t border-gray-200 pt-4 dark:border-gray-700">
                <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">Set Final Discount %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white dark:bg-gray-800 bg-white"
                  placeholder="e.g. 20"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Discount price is computed from each product price and stored.</p>
              </div>
            )}

            {action === "bulk-quantity" && (
              <div className="mb-6 border-t border-gray-200 pt-4 dark:border-gray-700">
                <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">Set Quantity</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={quantityValue}
                  onChange={(e) => setQuantityValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white dark:bg-gray-800 bg-white"
                  placeholder="e.g. 50"
                />
              </div>
            )}

            {action === "bulk-delete" ? (
              <div className="mb-6 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-md">
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">This will permanently delete all selected products.</p>
              </div>
            ) : null}

            <button
              onClick={() => {
                if (action === "bulk-set-active") return runBulkProductAction("set_active");
                if (action === "bulk-set-inactive") return runBulkProductAction("set_inactive");
                if (action === "bulk-change-price") return runBulkProductAction("change_price_percent");
                if (action === "bulk-set-discount") return runBulkProductAction("set_discount_percent");
                if (action === "bulk-quantity") return runBulkProductAction("set_quantity");
                if (action === "bulk-delete") return runBulkProductAction("delete_products");
              }}
              disabled={bulkActionLoading || selection.selectedIds.length === 0 || hasMixedShopSelection}
              className={`w-full px-4 py-2 rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${action === "bulk-delete" ? "bg-rose-700 text-white hover:bg-rose-800" : "bg-rose-600 text-white hover:bg-rose-700"}`}
            >
              {bulkActionLoading ? "Updating..." : action === "bulk-delete" ? "Delete Products" : "Update"}
            </button>

            {message ? (
              <div className={`mt-4 p-3 rounded-md text-sm font-medium ${message.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300"}`}>
                {message.text}
              </div>
            ) : null}
          </div>
        )}

        {action === "attributes" && (
          <div>
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">Selected Products</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{selection.selectedIds.length} selected</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select products from grid, choose attributes below, then click Update Attributes.</p>
            </div>

            {hasMixedShopSelection ? (
              <div className="mb-6 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-md">
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Selected products must be from the same shop</p>
              </div>
            ) : null}

            <div className="mb-6 border-t border-gray-200 pt-4 dark:border-gray-700">
              <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block">Attribute Updates</label>

              {loadingEditableAttributes ? (
                <div className="text-sm text-gray-600 dark:text-gray-400">Loading attributes...</div>
              ) : editableAttributes.length === 0 ? (
                <div className="text-sm text-gray-600 dark:text-gray-400">No attributes available.</div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {editableAttributes.map((attr) => (
                    <div key={attr.id}>
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">{attr.name}</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white dark:bg-gray-800 bg-white"
                        value={attributeUpdateByDefinition[attr.id] ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setAttributeUpdateByDefinition((prev) => ({ ...prev, [attr.id]: value }));
                        }}
                      >
                        <option value="">No change</option>
                        <option value={REMOVE_ATTRIBUTE_VALUE}>Remove attribute</option>
                        {attr.options.map((opt) => (
                          <option key={opt.id} value={String(opt.id)}>{opt.value}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={updateAttributesForSelectedProducts}
              disabled={loadingEditableAttributes || selection.selectedIds.length === 0 || hasMixedShopSelection}
              className="w-full px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update Attributes
            </button>

            {message ? (
              <div className={`mt-4 p-3 rounded-md text-sm font-medium ${message.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300"}`}>
                {message.text}
              </div>
            ) : null}
          </div>
        )}

        {action === "variants" && (
          <div>
            {mainProduct ? (
              <>
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">Main Product (Selected)</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{mainProduct.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{mainProduct.display_id}</p>
                </div>

                {loadingVariants ? (
                  <div className="text-center py-4 text-sm text-gray-600 dark:text-gray-400">Loading variants...</div>
                ) : (
                  <>
                    <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Existing Variants: {variantCount}</p>
                      {variantCount > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          (Variants may be on other pages)
                        </p>
                      )}
                    </div>

                    <div className="mb-6 border-t border-gray-200 pt-4 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Select/unselect products from the grid to add/remove variants. Selected variants appear in green.
                      </p>
                    </div>

                    <button
                      onClick={updateVariants}
                      disabled={loadingVariants}
                      className="w-full px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update Variants
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                  Select a product from the grid to manage its variants
                </p>
              </div>
            )}

            {message ? (
              <div className={`mt-4 p-3 rounded-md text-sm font-medium ${message.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300"}`}>
                {message.text}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
}
