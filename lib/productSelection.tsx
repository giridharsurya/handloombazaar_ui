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

const STORAGE_PREFIX = "product_selection:";

function loadScopeFromStorage(scope: string): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + scope);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
  } catch (e) {
    // ignore
  }
  return [];
}

function saveScopeToStorage(scope: string, ids: string[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + scope, JSON.stringify(ids));
  } catch (e) {
    // ignore
  }
}

export function ProductSelectionProvider({ children }: { children: React.ReactNode }) {
  const [scopes, setScopes] = useState<Record<string, string[]>>(() => {
    // lazily initialize only public by default
    if (typeof window === "undefined") return {} as Record<string, string[]>;
    return { public: loadScopeFromStorage("public") } as Record<string, string[]>;
  });

  const setScopeIds = useCallback((scope: string, ids: string[]) => {
    setScopes((prev) => {
      const next = { ...prev, [scope]: ids };
      return next;
    });
    saveScopeToStorage(scope, ids);
  }, []);

  const toggleScope = useCallback((id: string, scope: string) => {
    setScopes((prev) => {
      const current = new Set(prev[scope] ?? loadScopeFromStorage(scope));
      if (current.has(id)) current.delete(id);
      else current.add(id);
      const arr = Array.from(current);
      saveScopeToStorage(scope, arr);
      return { ...prev, [scope]: arr };
    });
  }, []);

  const clearScope = useCallback((scope: string) => {
    setScopes((prev) => ({ ...prev, [scope]: [] }));
    try {
      localStorage.removeItem(STORAGE_PREFIX + scope);
    } catch {}
  }, []);

  const selectAllScope = useCallback((ids: string[], scope: string) => {
    setScopes((prev) => ({ ...prev, [scope]: ids }));
    saveScopeToStorage(scope, ids);
  }, []);

  const isSelectedScope = useCallback((id: string, scope: string) => {
    const arr = scopes[scope] ?? (typeof window !== "undefined" ? loadScopeFromStorage(scope) : []);
    return arr.includes(id);
  }, [scopes]);

  const getSelectedIdsScope = useCallback((scope: string) => {
    return scopes[scope] ?? (typeof window !== "undefined" ? loadScopeFromStorage(scope) : []);
  }, [scopes]);

  const value = useMemo(
    () => ({ scopes, toggleScope, clearScope, selectAllScope, isSelectedScope, getSelectedIdsScope }),
    [scopes, toggleScope, clearScope, selectAllScope, isSelectedScope, getSelectedIdsScope]
  );

  // Sync: when provider mounts, ensure scopes loaded from storage
  useEffect(() => {
    // nothing — individual access will lazy-load
  }, []);

  // Clear sensitive scopes on logout (keep public scope)
  const { auth } = useAuth();
  useEffect(() => {
    if (!auth) {
      // user logged out — clear all non-public scopes in memory and storage
      setScopes({ public: loadScopeFromStorage("public") });
      try {
        // remove any keys that start with vendor: or admin
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith(STORAGE_PREFIX) && k !== STORAGE_PREFIX + "public") {
            localStorage.removeItem(k);
          }
        });
      } catch (e) {
        // ignore
      }
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
