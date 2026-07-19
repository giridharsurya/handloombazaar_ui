"use client";

import React from "react";
import api from "@/lib/api";

type Props = {
  selectedIds?: number[];
  onComplete?: () => void;
};

export default function BulkCollectionActions({ selectedIds = [], onComplete }: Props) {
  const [loading, setLoading] = React.useState(false);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} collections? This cannot be undone.`)) return;
    setLoading(true);
    try {
      for (const id of selectedIds) {
        await api.collections.deleteCollection(id);
      }
      onComplete?.();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="text-sm text-slate-600">Selected: {selectedIds.length}</div>
    </div>
  );
}
