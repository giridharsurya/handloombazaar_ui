"use client";

import React, { createContext, useContext, useState } from "react";
import api from "@/lib/api";
import { useProductSelection } from "@/lib/productSelection";

type ProductActionsCtx = {
  allProducts: any[];
  setAllProducts: (p: any[]) => void;
  actionViewIds: string[] | null;
  setActionViewIds: (ids: string[] | null) => void;
  applyViewForVendorCollection: (shopId: string | undefined, collectionId: number, mode: "add" | "delete" | "view") => void;
  applyViewForSystemCollection: (collectionId: number, mode: "add" | "delete" | "view") => Promise<void>;
  confirmAction: (opts: { subtype: "vendor" | "system"; shopId?: string; collectionId?: number; mode?: "add" | "delete" }) => Promise<void>;
};

const ProductActionsContext = createContext<ProductActionsCtx | null>(null);

export function ProductActionsProvider({ children }: { children: React.ReactNode }) {
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [actionViewIds, setActionViewIds] = useState<string[] | null>(null);
  const selection = useProductSelection();

  const applyViewForVendorCollection = (shopId: string | undefined, collectionId: number, mode: "add" | "delete" | "view") => {
    if (!shopId) {
      setActionViewIds(null);
      return;
    }
    const raw = localStorage.getItem(`vendor_collection_products:${shopId}:${collectionId}`);
    const parsed: string[] = raw ? JSON.parse(raw) : [];
    if (mode === "add") {
      const ids = allProducts.map((p) => String(p.display_id)).filter((id) => !parsed.includes(id));
      setActionViewIds(ids);
    } else if (mode === "delete") {
      setActionViewIds(parsed);
    } else {
      setActionViewIds(null);
    }
  };

  const applyViewForSystemCollection = async (collectionId: number, mode: "add" | "delete" | "view") => {
    try {
      const res = await fetch(`/api/collections/${collectionId}/products`);
      if (!res.ok) {
        setActionViewIds(null);
        return;
      }
      const data = await res.json();
      const existingIds = (data.items || data || []).map((p: any) => String(p.display_id));
      if (mode === "add") {
        const ids = allProducts.map((p) => String(p.display_id)).filter((id) => !existingIds.includes(id));
        setActionViewIds(ids);
      } else if (mode === "delete") {
        setActionViewIds(existingIds);
      } else {
        setActionViewIds(null);
      }
    } catch (e) {
      setActionViewIds(null);
    }
  };

  const confirmAction = async (opts: { subtype: "vendor" | "system"; shopId?: string; collectionId?: number; mode?: "add" | "delete" }) => {
    const { subtype, shopId, collectionId, mode } = opts;
    const selectedIds = selection.selectedIds;
    if (!selectedIds || selectedIds.length === 0) return;

    if (subtype === "vendor") {
      if (!shopId || !collectionId) return;
      const key = `vendor_collection_products:${shopId}:${collectionId}`;
      const raw = localStorage.getItem(key);
      const existing: string[] = raw ? JSON.parse(raw) : [];
      if (mode === "add") {
        const merged = Array.from(new Set([...existing, ...selectedIds]));
        localStorage.setItem(key, JSON.stringify(merged));
      } else if (mode === "delete") {
        const filtered = existing.filter((id) => !selectedIds.includes(id));
        localStorage.setItem(key, JSON.stringify(filtered));
      }
      // clear selection after operation
      selection.clear();
      return;
    }

    // system
    try {
      if (!collectionId) return;
      if (mode === "add") {
        await fetch(`/api/collections/${collectionId}/add`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_ids: selectedIds }) });
      } else if (mode === "delete") {
        await fetch(`/api/collections/${collectionId}/remove`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_ids: selectedIds }) });
      }
      selection.clear();
    } catch (e) {
      // ignore
    }
  };

  return (
    <ProductActionsContext.Provider value={{ allProducts, setAllProducts, actionViewIds, setActionViewIds, applyViewForVendorCollection, applyViewForSystemCollection, confirmAction }}>
      {children}
    </ProductActionsContext.Provider>
  );
}

export function useProductActions() {
  const ctx = useContext(ProductActionsContext);
  if (!ctx) throw new Error("useProductActions must be used within ProductActionsProvider");
  return ctx;
}
