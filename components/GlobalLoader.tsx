"use client";

import React from "react";
import { useApiLoading } from "@/lib/LoadingProvider";

export default function GlobalLoader() {
  const { isLoading } = useApiLoading();
  return isLoading ? (
    <div className="fixed right-4 top-4 z-50">
      <div className="rounded-full bg-slate-900 px-3 py-2 text-xs font-medium text-white">Loading...</div>
    </div>
  ) : null;
}
