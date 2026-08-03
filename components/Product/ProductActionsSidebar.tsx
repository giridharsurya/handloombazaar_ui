"use client";

import React, { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { useSelectionScope, useProductSelection } from "@/lib/productSelection";
import { useProductActions } from "@/lib/productActions";
import { useVariantSelection } from "@/lib/VariantSelectionContext";
import type { ProductListItem } from "@/types/apiTypes";

type ActionMode = "view" | "add" | "delete";

export default function ProductActionsSidebar({ scope }: { scope?: string }) {
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

  const shopId = resolvedScope && resolvedScope.startsWith("vendor:") ? resolvedScope.split(":")[1] : undefined;

  // Keep the main product fixed while in variants mode.
  const mainProduct = useMemo(() => {
    if (action === "variants" && variantMainProductId) {
      return allProducts?.find((p) => p.display_id === variantMainProductId) || null;
    }
    return null;
  }, [action, variantMainProductId, allProducts]);

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
    const loadSystem = async () => {
      try {
        const data = await api.collections.list({
          kind: "system",
          shop_display_id: shopId,
          authenticated: !!shopId,
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
  }, [shopId]);

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

  return (
    <aside className="w-64 shrink-0 sticky top-[calc(var(--app-header-height,120px)+var(--filter-header-height,72px))] self-start">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 h-fit border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Actions</h3>
        
        <div className="mb-8 border-t border-gray-200 pt-4 dark:border-gray-700">
          <label className="text-sm font-semibold text-gray-900 dark:text-white mb-3 block">Action</label>
          <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white dark:bg-gray-800 bg-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">Select action</option>
            <option value="collections">Collections</option>
            <option value="variants">Select Variants</option>
            <option value="modify">Modify Products</option>
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

        {action === "modify" && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-8 border-t border-gray-200 pt-4 dark:border-gray-700">Modify actions can be plugged here.</div>
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
