"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";

type LoaderContext = {
  isLoading: boolean;
  increment: () => void;
  decrement: () => void;
};

const Context = createContext<LoaderContext | null>(null);

let externalIncrement: (() => void) | null = null;
let externalDecrement: (() => void) | null = null;

export function setGlobalLoaderHandlers(inc: () => void, dec: () => void) {
  externalIncrement = inc;
  externalDecrement = dec;
}

export function clearGlobalLoaderHandlers() {
  externalIncrement = null;
  externalDecrement = null;
}

export function useApiLoading() {
  const ctx = useContext(Context);
  if (!ctx) return { isLoading: false, increment: () => {}, decrement: () => {} };
  return ctx;
}

export function ApiLoadingProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const timerRef = useRef<number | null>(null);

  const increment = () => setCount((c) => c + 1);
  const decrement = () => setCount((c) => Math.max(0, c - 1));

  useEffect(() => {
    // expose handlers for non-React modules (apiClient)
    setGlobalLoaderHandlers(increment, decrement);
    return () => clearGlobalLoaderHandlers();
  }, []);

  // simple debounce to avoid flicker for very fast requests
  const isLoading = count > 0;

  return <Context.Provider value={{ isLoading, increment, decrement }}>{children}</Context.Provider>;
}

export default ApiLoadingProvider;
