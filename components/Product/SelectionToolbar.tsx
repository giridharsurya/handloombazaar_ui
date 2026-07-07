"use client";

import React from "react";
import { useProductSelection, useSelectionScope } from "@/lib/productSelection";
import { useAuth } from "@/lib/AuthContext";

type SelectionToolbarProps = {
  visibleIds?: string[];
  scope?: string;
};

export default function SelectionToolbar({ visibleIds, scope }: SelectionToolbarProps) {
  const resolvedScope = useSelectionScope(scope);
  const { count, clear, selectAll } = useProductSelection(resolvedScope);
  const { auth } = useAuth();

  const scopeLabel = (() => {
    if (resolvedScope === "public") return "Public";
    if (resolvedScope === "admin") return "Admin";
    if (resolvedScope.startsWith("vendor:")) {
      const parts = resolvedScope.split(":");
      const shopId = parts[1];
      if (auth && auth.shop_display_id === shopId && auth.shop_name) return `Vendor — ${auth.shop_name}`;
      return `Vendor — ${shopId}`;
    }
    return resolvedScope;
  })();

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{count} selected</span>
        <button
          type="button"
          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded"
          onClick={() => visibleIds && selectAll(visibleIds)}
        >
          Select all
        </button>
        <button
          type="button"
          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded"
          onClick={clear}
        >
          Clear
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600">{/* placeholder for bulk actions */}</div>
        <div className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          {scopeLabel}
        </div>
      </div>
    </div>
  );
}
