"use client";

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { usePathname } from "next/navigation";

type BoundSelectionApi = {
  selectedIds: string[];
  count: number;
  toggle: (id: string) => void;
  clear: () => void;
  selectAll: (ids: string[]) => void;
  isSelected: (id: string) => boolean;
};

type ProductSelectionContextValue = {
  // raw map of scope -> selected ids
  scopes: Record<string, string[]>;
  // helpers to operate on any scope
  toggleScope: (id: string, scope: string) => void;
  clearScope: (scope: string) => void;
  selectAllScope: (ids: string[], scope: string) => void;
  isSelectedScope: (id: string, scope: string) => boolean;
  getSelectedIdsScope: (scope: string) => string[];
};

const noop = () => {};

const ProductSelectionContext = createContext<ProductSelectionContextValue | null>(null);

// Selection is kept in-memory only (no persistent storage)

export function ProductSelectionProvider({ children }: { children: React.ReactNode }) {
  const [scopes, setScopes] = useState<Record<string, string[]>>(() => ({ public: [] }));

  const setScopeIds = useCallback((scope: string, ids: string[]) => {
    setScopes((prev) => {
      const next = { ...prev, [scope]: ids };
      return next;
    });
  }, []);

  const toggleScope = useCallback((id: string, scope: string) => {
    setScopes((prev) => {
      const current = new Set(prev[scope] ?? []);
      if (current.has(id)) current.delete(id);
      else current.add(id);
      const arr = Array.from(current);
      return { ...prev, [scope]: arr };
    });
  }, []);

  const clearScope = useCallback((scope: string) => {
    setScopes((prev) => ({ ...prev, [scope]: [] }));
  }, []);

  const selectAllScope = useCallback((ids: string[], scope: string) => {
    setScopes((prev) => ({ ...prev, [scope]: ids }));
  }, []);

  const isSelectedScope = useCallback((id: string, scope: string) => {
    const arr = scopes[scope] ?? [];
    return arr.includes(id);
  }, [scopes]);

  const getSelectedIdsScope = useCallback((scope: string) => {
    return scopes[scope] ?? [];
  }, [scopes]);

  const value = useMemo(
    () => ({ scopes, toggleScope, clearScope, selectAllScope, isSelectedScope, getSelectedIdsScope }),
    [scopes, toggleScope, clearScope, selectAllScope, isSelectedScope, getSelectedIdsScope]
  );

  // Clear sensitive scopes on logout (keep public scope)
  const { auth } = useAuth();
  useEffect(() => {
    if (!auth) {
      // user logged out — clear non-public scopes in memory
      setScopes({ public: [] });
    }
  }, [auth]);

  return <ProductSelectionContext.Provider value={value}>{children}</ProductSelectionContext.Provider>;
}

// Resolve a scope using auth and pathname heuristics
export function useSelectionScope(explicitScope?: string) {
  const { auth } = useAuth();
  const pathname = usePathname();

  if (explicitScope) return explicitScope;

  if (!pathname) return "public";

  // Admin area: paths starting with /admin
  if (pathname.startsWith("/admin")) return "admin";

  // Vendor area: paths starting with /vendor
  if (pathname.startsWith("/vendor")) {
    if (auth && auth.role === "shop_owner" && auth.shop_display_id) return `vendor:${auth.shop_display_id}`;
    return "vendor";
  }

  // Shop detail pages (public-facing) detect /shops/:id
  if (pathname.startsWith("/shops")) return "public";

  // Default to public
  return "public";
}

export function useProductSelection(scope?: string): BoundSelectionApi {
  const ctx = useContext(ProductSelectionContext);
  if (!ctx) {
    return {
      selectedIds: [],
      count: 0,
      toggle: noop,
      clear: noop,
      selectAll: noop,
      isSelected: () => false,
    };
  }

  const resolvedScope = scope ?? "public";

  const selectedIds = ctx.getSelectedIdsScope(resolvedScope);
  const count = selectedIds.length;

  const toggle = (id: string) => ctx.toggleScope(id, resolvedScope);
  const clear = () => ctx.clearScope(resolvedScope);
  const selectAll = (ids: string[]) => ctx.selectAllScope(ids, resolvedScope);
  const isSelected = (id: string) => ctx.isSelectedScope(id, resolvedScope);

  return { selectedIds, count, toggle, clear, selectAll, isSelected };
}

export default ProductSelectionProvider;
