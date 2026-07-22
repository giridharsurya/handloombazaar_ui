"use client";

import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import CollectionForm from "@/components/Collections/CollectionForm";
import CollectionsList from "@/components/Collections/CollectionsList";

export default function VendorCollectionsPage() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !auth) {
      router.push("/auth/login");
      return;
    }
    if (!isLoading && auth && auth.role !== "shop_owner") {
      router.push("/");
    }
  }, [auth, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!auth || auth.role !== "shop_owner") return null;
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Collections</h1>
          <p className="mt-2 text-lg text-slate-600">Manage collections for your shop.</p>
        </div>

        <CollectionsManager shopDisplayId={auth?.shop_display_id} />
      </div>
    </div>
  );
}

function CollectionsManager({ shopDisplayId }: { shopDisplayId?: string | null }) {
  const [editingCollectionId, setEditingCollectionId] = React.useState<number | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleEdit = (col: any) => setEditingCollectionId(col.id);
  const handleCancelEdit = () => setEditingCollectionId(null);
  const handleSaved = async () => {
    setEditingCollectionId(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="rounded-lg border border-slate-300 bg-white p-6">
        <CollectionForm mode="create" vendorOnly shopDisplayId={shopDisplayId ?? undefined} onSaved={handleSaved} />
      </div>

      <div className="rounded-lg border border-slate-300 bg-white p-6">
        <CollectionsList key={refreshKey} scope="vendor" shopDisplayId={shopDisplayId ?? undefined} editingCollectionId={editingCollectionId} onEdit={handleEdit} onCancelEdit={handleCancelEdit} onSaved={handleSaved} />
      </div>
    </div>
  );
}
