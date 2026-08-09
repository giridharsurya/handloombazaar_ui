"use client";

import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
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
      <div className="mx-auto">
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
  const [collections, setCollections] = React.useState<any[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = React.useState(false);
  const [feedback, setFeedback] = React.useState("");

  const handleEdit = (col: any) => setEditingCollectionId(col.id);
  const handleCancelEdit = () => setEditingCollectionId(null);
  const handleSaved = async () => {
    setEditingCollectionId(null);
    setRefreshKey((k) => k + 1);
  };

  const loadCollections = async () => {
    if (!shopDisplayId) {
      setCollections([]);
      return;
    }

    setIsLoadingCollections(true);
    setFeedback("");
    try {
      const [shopRows, systemRows] = await Promise.all([
        api.collections.list({ kind: "shop", shop_display_id: shopDisplayId, authenticated: true }),
        api.collections.list({ kind: "system", shop_display_id: shopDisplayId, authenticated: true }),
      ]);

      const normalizedShopRows = Array.isArray(shopRows)
        ? shopRows.map((row: any) => ({ ...row, source: "shop" as const }))
        : [];
      const normalizedSystemRows = Array.isArray(systemRows)
        ? systemRows.map((row: any) => ({ ...row, source: "system" as const }))
        : [];

      const combined = [...normalizedShopRows, ...normalizedSystemRows];
      combined.sort((a, b) => {
        const aOrder = Number(a.homepage_order || 0);
        const bOrder = Number(b.homepage_order || 0);
        if (bOrder !== aOrder) return bOrder - aOrder;
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate || b.id - a.id;
      });

      setCollections(combined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load collections";
      setFeedback(message);
      setCollections([]);
    } finally {
      setIsLoadingCollections(false);
    }
  };

  React.useEffect(() => {
    loadCollections();
  }, [shopDisplayId, refreshKey]);

  const handleToggleHomepageDisplay = async (collectionId: number, displayOnHomepage: boolean) => {
    try {
      await api.collections.toggleHomepageDisplay(collectionId, displayOnHomepage, shopDisplayId ?? undefined);
      await loadCollections();
      setFeedback("Homepage settings updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update homepage settings";
      setFeedback(message);
    }
  };

  const handleOrderHomepageCollections = async (collectionIds: number[]) => {
    try {
      await api.collections.orderHomepageCollections(collectionIds, shopDisplayId ?? undefined);
      await loadCollections();
      setFeedback("Homepage order updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update homepage order";
      setFeedback(message);
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="rounded-lg border border-slate-300 bg-white p-6">
        <CollectionForm mode="create" vendorOnly shopDisplayId={shopDisplayId ?? undefined} onSaved={handleSaved} />
      </div>

      <div className="rounded-lg border border-slate-300 bg-white p-6">
        <CollectionsList
          key={refreshKey}
          collections={collections}
          scope="vendor"
          shopDisplayId={shopDisplayId ?? undefined}
          editingCollectionId={editingCollectionId}
          onEdit={handleEdit}
          onCancelEdit={handleCancelEdit}
          onSaved={handleSaved}
          showHomepageControls={true}
          onToggleHomepageDisplay={handleToggleHomepageDisplay}
          onOrderHomepageCollections={handleOrderHomepageCollections}
        />
        {feedback ? <p className="mt-3 text-sm text-slate-700">{feedback}</p> : null}
      </div>
    </div>
  );
}
