"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type VariantSelectionContextType = {
  isVariantMode: boolean;
  mainProductId: string | null;
  variantProductIds: Set<string>;
  setVariantMode: (isActive: boolean, mainId: string | null, variantIds: Set<string>) => void;
  clearVariantMode: () => void;
};

const VariantSelectionContext = createContext<VariantSelectionContextType | undefined>(undefined);

export function VariantSelectionProvider({ children }: { children: React.ReactNode }) {
  const [isVariantMode, setIsVariantMode] = useState(false);
  const [mainProductId, setMainProductId] = useState<string | null>(null);
  const [variantProductIds, setVariantProductIds] = useState<Set<string>>(new Set());

  const setVariantMode = useCallback((isActive: boolean, mainId: string | null, variantIds: Set<string>) => {
    setIsVariantMode(isActive);
    setMainProductId(mainId);
    setVariantProductIds(new Set(variantIds));
  }, []);

  const clearVariantMode = useCallback(() => {
    setIsVariantMode(false);
    setMainProductId(null);
    setVariantProductIds(new Set());
  }, []);

  return (
    <VariantSelectionContext.Provider
      value={{ isVariantMode, mainProductId, variantProductIds, setVariantMode, clearVariantMode }}
    >
      {children}
    </VariantSelectionContext.Provider>
  );
}

export function useVariantSelection() {
  const context = useContext(VariantSelectionContext);
  if (!context) {
    throw new Error("useVariantSelection must be used within VariantSelectionProvider");
  }
  return context;
}
