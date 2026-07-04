"use client";

import React, { createContext, useContext, ReactNode } from "react";
import api from "./api";

type ApiContextType = typeof api;

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
};

export function useApi(): ApiContextType {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useApi must be used within an ApiProvider");
  return ctx;
}

export default ApiProvider;
