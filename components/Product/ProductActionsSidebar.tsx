"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useSelectionScope, useProductSelection } from "@/lib/productSelection";
import { useProductActions } from "@/lib/productActions";

type ActionMode = "view" | "add" | "delete";

export default function ProductActionsSidebar({ scope }: { scope?: string }) {
  const resolvedScope = useSelectionScope(scope);
  const { allProducts, setAllProducts, applyViewForVendorCollection, applyViewForSystemCollection, confirmAction, setActionViewIds } = useProductActions();
  const selection = useProductSelection(resolvedScope);
  const [action, setAction] = useState<string>("");
  const [subtype, setSubtype] = useState<"system" | "vendor">("vendor");
  const [collections, setCollections] = useState<any[]>([]);
  const [vendorCollections, setVendorCollections] = useState<any[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [mode, setMode] = useState<ActionMode>("view");
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const shopId = resolvedScope && resolvedScope.startsWith("vendor:") ? resolvedScope.split(":")[1] : undefined;

  useEffect(() => {
    // when switching between system/vendor collections, clear selection and view
    setSelectedCollectionId(null);
    setActionViewIds(null);
    selection.clear();
  }, [subtype, setActionViewIds]);

  useEffect(() => {
    const loadSystem = async () => {
      try {
        const data = await api.collections.list({ kind: "system" });
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

  return (
    <aside className="w-64 shrink-0 sticky top-[calc(var(--app-header-height,120px)+var(--filter-header-height,72px))]">
      <div className="border rounded p-4 bg-white dark:bg-gray-900">
        <h4 className="font-semibold mb-2">Actions</h4>
        <div className="mb-3">
          <label className="text-xs text-gray-600">Action</label>
          <select className="w-full p-2 border rounded mt-1" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">Select action</option>
            <option value="collections">Collections</option>
            <option value="modify">Modify Products</option>
          </select>
        </div>

        {action === "collections" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600">Collection Type</label>
              <div className="flex gap-2 mt-1">
                <button className={`px-2 py-1 rounded ${subtype === "vendor" ? "bg-rose-600 text-white" : "bg-gray-100"}`} onClick={() => setSubtype("vendor")}>My Collections</button>
                <button className={`px-2 py-1 rounded ${subtype === "system" ? "bg-rose-600 text-white" : "bg-gray-100"}`} onClick={() => setSubtype("system")}>System Collections</button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600">Select Collection</label>
              <select
                className="w-full p-2 border rounded mt-1"
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

            <div>
              <label className="text-xs text-gray-600">Mode</label>
              <div className="flex gap-2 mt-1">
                <button
                  className={`px-2 py-1 rounded ${mode === "add" ? "bg-rose-600 text-white" : "bg-gray-100"}`}
                  onClick={() => fetchFor(selectedCollectionId, "add")}
                  disabled={!selectedCollectionId}
                >
                  Add
                </button>
                <button
                  className={`px-2 py-1 rounded ${mode === "delete" ? "bg-rose-600 text-white" : "bg-gray-100"}`}
                  onClick={() => fetchFor(selectedCollectionId, "delete")}
                  disabled={!selectedCollectionId}
                >
                  Delete
                </button>
                <button
                  className={`px-2 py-1 rounded ${mode === "view" ? "bg-rose-600 text-white" : "bg-gray-100"}`}
                  onClick={async () => {
                    setMode("view");
                    if (selectedCollectionId) await fetchFor(selectedCollectionId, "view");
                    else setActionViewIds(null);
                  }}
                >
                  Reset View
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button className="flex-1 px-3 py-2 bg-rose-600 text-white rounded" onClick={confirmActionLocal} disabled={!selectedCollectionId || selection.count===0}>Confirm</button>
            </div>
            <div className="text-xs text-gray-500 mt-2">Selected products: {selection.count}</div>
            {message ? (
              <div className={`mt-2 text-sm ${message.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>{message.text}</div>
            ) : null}
          </div>
        )}

        {action === "modify" && (
          <div className="text-sm text-gray-500">Modify actions can be plugged here.</div>
        )}
      </div>
    </aside>
  );
}
