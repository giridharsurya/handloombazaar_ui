"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import api from "@/lib/api";
import { useProductSelection } from "@/lib/productSelection";

type ActionMode = "view" | "add" | "delete";

type ActionCollectionQuery = {
  subtype: "vendor" | "system";
  shopId?: string;
  collectionId: number;
  mode: "add" | "delete" | "view";
};

type SidebarActionState = {
  action: string;
  subtype: "vendor" | "system";
  selectedCollectionId: number | null;
  mode: ActionMode;
};

type ProductActionsCtx = {
  allProducts: any[];
  setAllProducts: (p: any[]) => void;
  actionViewIds: string[] | null;
  setActionViewIds: (ids: string[] | null) => void;
  actionCollectionQuery: ActionCollectionQuery | null;
  clearActionCollection: () => void;
  applyViewForVendorCollection: (shopId: string | undefined, collectionId: number, mode: "add" | "delete" | "view") => Promise<void>;
  applyViewForSystemCollection: (collectionId: number, mode: "add" | "delete" | "view") => Promise<void>;
  confirmAction: (opts: { subtype: "vendor" | "system"; shopId?: string; collectionId?: number; mode?: "add" | "delete"; selectedIds?: string[] }) => Promise<any>;
  sidebarActionState: SidebarActionState;
  setSidebarActionState: (state: SidebarActionState) => void;
  clearSidebarActionState: () => void;
};

const ProductActionsContext = createContext<ProductActionsCtx | null>(null);

export function ProductActionsProvider({ children }: { children: React.ReactNode }) {
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [actionViewIdsRaw, setActionViewIdsRaw] = useState<string[] | null>(null);
  const [actionCollectionQuery, setActionCollectionQuery] = useState<ActionCollectionQuery | null>(null);
  const [sidebarActionState, setSidebarActionState] = useState<SidebarActionState>({ action: "", subtype: "vendor", selectedCollectionId: null, mode: "view" });
  const selection = useProductSelection();

  const setActionViewIds = useCallback((ids: string[] | null) => {
    setActionViewIdsRaw(ids);
  }, []);

  const clearActionCollection = useCallback(() => {
    console.log("[ProductActions] clearActionCollection");
    setActionViewIdsRaw(null);
    setActionCollectionQuery(null);
  }, []);



  const applyViewForVendorCollection = async (shopId: string | undefined, collectionId: number, mode: "add" | "delete" | "view") => {
    console.log("[ProductActions] applyViewForVendorCollection", { shopId, collectionId, mode });
    if (!shopId) {
      setActionViewIds(null);
      return;
    }

    try {
      setActionCollectionQuery({ subtype: "vendor", shopId, collectionId, mode });
      setActionViewIdsRaw(null);
    } catch (e) {
      console.log("[ProductActions] applyViewForVendorCollection error", e);
      setActionViewIds(null);
    }
  };

  const applyViewForSystemCollection = async (collectionId: number, mode: "add" | "delete" | "view") => {
    console.log("[ProductActions] applyViewForSystemCollection", { collectionId, mode });
    try {
      setActionCollectionQuery({ subtype: "system", collectionId, mode });
      setActionViewIdsRaw(null);
    } catch (e) {
      console.log("[ProductActions] applyViewForSystemCollection error", e);
      setActionViewIds(null);
    }
  };

  const confirmAction = async (opts: { subtype: "vendor" | "system"; shopId?: string; collectionId?: number; mode?: "add" | "delete"; selectedIds?: string[] }) => {
    const { subtype, shopId, collectionId, mode } = opts;
    const selectedIds = (opts.selectedIds && opts.selectedIds.length > 0) ? opts.selectedIds : selection.selectedIds;
    if (!selectedIds || selectedIds.length === 0) return;

    if (subtype === "vendor") {
      if (!shopId || !collectionId) return;
      if (!collectionId) return;
      if (mode === "add") {
        const res = await api.collections.addProducts(collectionId, selectedIds);
        return res;
      } else if (mode === "delete") {
        const res = await api.collections.removeProducts(collectionId, selectedIds);
        return res;
      }
      return;
    }

    // system
    if (!collectionId) return;
    if (mode === "add") {
      const res = await api.collections.addProducts(collectionId, selectedIds);
      return res;
    } else if (mode === "delete") {
      const res = await api.collections.removeProducts(collectionId, selectedIds);
      return res;
    }
    return;
  };

  const clearSidebarActionState = useCallback(() => {
    setSidebarActionState({ action: "", subtype: "vendor", selectedCollectionId: null, mode: "view" });
  }, []);

  return (
    <ProductActionsContext.Provider value={{ allProducts, setAllProducts, actionViewIds: actionViewIdsRaw, setActionViewIds, clearActionCollection, actionCollectionQuery, applyViewForVendorCollection, applyViewForSystemCollection, confirmAction, sidebarActionState, setSidebarActionState, clearSidebarActionState }}>
      {children}
    </ProductActionsContext.Provider>
  );
}

export function useProductActions() {
  const ctx = useContext(ProductActionsContext);
  if (!ctx) throw new Error("useProductActions must be used within ProductActionsProvider");
  return ctx;
}
