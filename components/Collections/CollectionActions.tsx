"use client";

import React from "react";
import api from "@/lib/api";

type Props = {
  collectionId: number;
  onDeleted?: () => void;
};

export default function CollectionActions({ collectionId, onDeleted }: Props) {
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this collection?")) return;
    setLoading(true);
    try {
      await api.collections.deleteCollection(collectionId);
      onDeleted?.();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleDelete} disabled={loading} style={{ color: "red" }}>
        Delete
      </button>
    </div>
  );
}
