"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useSelectionScope, useProductSelection } from "@/lib/productSelection";
import { useProductActions } from "@/lib/productActions";

type ActionMode = "view" | "add" | "delete";

export default function ProductActionsSidebar({ scope }: { scope?: string }) {
  const resolvedScope = useSelectionScope(scope);
  const { allProducts, setAllProducts, applyViewForVendorCollection, applyViewForSystemCollection, confirmAction } = useProductActions();
  const selection = useProductSelection(resolvedScope);
  const [action, setAction] = useState<string>("");
  const [subtype, setSubtype] = useState<"system" | "vendor">("vendor");
  const [collections, setCollections] = useState<any[]>([]);
  const [vendorCollections, setVendorCollections] = useState<any[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [mode, setMode] = useState<ActionMode>("view");

  const shopId = resolvedScope && resolvedScope.startsWith("vendor:") ? resolvedScope.split(":")[1] : undefined;

  useEffect(() => {
    const loadSystem = async () => {
      try {
        const data = await api.admin.getCollections();
        setCollections(data || []);
      } catch (e) {
        setCollections([]);
      }
    };

    const loadVendor = () => {
      if (!shopId) return setVendorCollections([]);
      try {
        const raw = localStorage.getItem(`vendor_collections:${shopId}`);
        const parsed = raw ? JSON.parse(raw) : [];
        setVendorCollections(parsed);
      } catch (e) {
        setVendorCollections([]);
      }
    };

    loadSystem();
    loadVendor();
  }, [shopId]);

  // compute visible ids based on selection in sidebar
  const applyView = () => {
    if (!selectedCollectionId) return;
    if (subtype === "vendor") {
      applyViewForVendorCollection(shopId, selectedCollectionId, mode === "view" ? "view" : mode);
      return;
    }
    applyViewForSystemCollection(selectedCollectionId, mode === "view" ? "view" : mode);
  };

  const confirmActionLocal = async () => {
    const passMode = mode === "view" ? undefined : mode;
    await confirmAction({ subtype, shopId, collectionId: selectedCollectionId ?? undefined, mode: passMode as any });
    // refresh vendor collections listing
    try {
      const vraw = localStorage.getItem(`vendor_collections:${shopId}`);
      setVendorCollections(vraw ? JSON.parse(vraw) : []);
    } catch (e) {}
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
              <select className="w-full p-2 border rounded mt-1" value={selectedCollectionId ?? ""} onChange={(e) => setSelectedCollectionId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Choose collection</option>
                {(subtype === "vendor" ? vendorCollections : collections).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600">Mode</label>
              <div className="flex gap-2 mt-1">
                <button className={`px-2 py-1 rounded ${mode === "add" ? "bg-rose-600 text-white" : "bg-gray-100"}`} onClick={() => setMode("add")} >Add</button>
                <button className={`px-2 py-1 rounded ${mode === "delete" ? "bg-rose-600 text-white" : "bg-gray-100"}`} onClick={() => setMode("delete")}>Delete</button>
                <button className={`px-2 py-1 rounded ${mode === "view" ? "bg-rose-600 text-white" : "bg-gray-100"}`} onClick={() => setMode("view")}>Reset View</button>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button className="flex-1 px-3 py-2 bg-gray-100 rounded" onClick={applyView} disabled={!selectedCollectionId}>Apply View</button>
              <button className="flex-1 px-3 py-2 bg-rose-600 text-white rounded" onClick={confirmActionLocal} disabled={!selectedCollectionId || selection.count===0}>Confirm</button>
            </div>
            <div className="text-xs text-gray-500 mt-2">Selected products: {selection.count}</div>
          </div>
        )}

        {action === "modify" && (
          <div className="text-sm text-gray-500">Modify actions can be plugged here.</div>
        )}
      </div>
    </aside>
  );
}
