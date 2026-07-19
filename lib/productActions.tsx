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
    (async () => {
      if (!shopId) {
        setActionViewIds(null);
        return;
      }

      try {
        const constraints = await api.collections.getConstraints(collectionId);
        const productsResp = await api.collections.getProducts(collectionId, { authenticated: true });
        const existingIds = (productsResp.items || productsResp || []).map((p: any) => String(p.display_id));

        let candidateProducts = [] as any[];
        if (mode === "add") {
          candidateProducts = allProducts.filter((p) => !existingIds.includes(String(p.display_id)));
        } else if (mode === "delete") {
          candidateProducts = allProducts.filter((p) => existingIds.includes(String(p.display_id)));
        } else {
          setActionViewIds(null);
          return;
        }

        // apply allowed shops filter
        if (constraints?.allowed_shop_display_ids && Array.isArray(constraints.allowed_shop_display_ids) && constraints.allowed_shop_display_ids.length > 0) {
          candidateProducts = candidateProducts.filter((p) => constraints.allowed_shop_display_ids.includes(p.shop_display_id));
        }

        // apply required attributes filter
        if (constraints?.required_attributes && Array.isArray(constraints.required_attributes) && constraints.required_attributes.length > 0) {
          const filtered: any[] = [];
          const detailCache = new Map<string, any>();
          for (const p of candidateProducts) {
            let attrs = p.attributes; // from product list
            if (!attrs || attrs.length === 0) {
              try {
                const detail = await api.products.getProductDetails(String(p.display_id), { authenticated: true });
                attrs = (detail.product?.attributes || []) as any[];
                detailCache.set(String(p.display_id), attrs);
              } catch (e) {
                attrs = [];
              }
            }

            // check all required attribute rules (AND across definitions)
            let ok = true;
            for (const rule of constraints.required_attributes) {
              // rule: { definition_id, option_ids }
              const match = attrs.find((a: any) => a.definition_id === rule.definition_id && (rule.option_ids ? rule.option_ids.includes(a.option_id) : a.option_id === rule.option_id));
              if (!match) {
                ok = false;
                break;
              }
            }
            if (ok) filtered.push(p);
          }
          candidateProducts = filtered;
        }

        setActionViewIds(candidateProducts.map((p) => String(p.display_id)));
      } catch (e) {
        setActionViewIds(null);
      }
    })();
  };

  const applyViewForSystemCollection = async (collectionId: number, mode: "add" | "delete" | "view") => {
    try {
      const constraints = await api.collections.getConstraints(collectionId);
      const productsResp = await api.collections.getProducts(collectionId, { authenticated: true });
      const existingIds = (productsResp.items || productsResp || []).map((p: any) => String(p.display_id));

      let candidateProducts: any[] = [];
      if (mode === "add") {
        candidateProducts = allProducts.filter((p) => !existingIds.includes(String(p.display_id)));
      } else if (mode === "delete") {
        candidateProducts = allProducts.filter((p) => existingIds.includes(String(p.display_id)));
      } else {
        setActionViewIds(null);
        return;
      }

      if (constraints?.allowed_shop_display_ids && Array.isArray(constraints.allowed_shop_display_ids) && constraints.allowed_shop_display_ids.length > 0) {
        candidateProducts = candidateProducts.filter((p) => constraints.allowed_shop_display_ids.includes(p.shop_display_id));
      }

      if (constraints?.required_attributes && Array.isArray(constraints.required_attributes) && constraints.required_attributes.length > 0) {
        const filtered: any[] = [];
        for (const p of candidateProducts) {
          let attrs = p.attributes;
          if (!attrs || attrs.length === 0) {
            try {
              const detail = await api.products.getProductDetails(String(p.display_id), { authenticated: true });
              attrs = (detail.product?.attributes || []) as any[];
            } catch (e) {
              attrs = [];
            }
          }
          let ok = true;
          for (const rule of constraints.required_attributes) {
            const match = attrs.find((a: any) => a.definition_id === rule.definition_id && (rule.option_ids ? rule.option_ids.includes(a.option_id) : a.option_id === rule.option_id));
            if (!match) {
              ok = false;
              break;
            }
          }
          if (ok) filtered.push(p);
        }
        candidateProducts = filtered;
      }

      setActionViewIds(candidateProducts.map((p) => String(p.display_id)));
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
      try {
        if (mode === "add") {
          await api.collections.addProducts(collectionId, selectedIds);
        } else if (mode === "delete") {
          await api.collections.removeProducts(collectionId, selectedIds);
        }
      } catch (e) {
        // ignore for now
      }
      selection.clear();
      return;
    }

    // system
    try {
      if (!collectionId) return;
      if (mode === "add") {
        await api.collections.addProducts(collectionId, selectedIds);
      } else if (mode === "delete") {
        await api.collections.removeProducts(collectionId, selectedIds);
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
