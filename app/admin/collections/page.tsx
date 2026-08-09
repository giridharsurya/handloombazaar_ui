"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/ApiProvider";
import { useAuth } from "@/lib/AuthContext";
import CollectionForm from "@/components/Collections/CollectionForm";
import CollectionsList from "@/components/Collections/CollectionsList";

type Shop = {
  id: number;
  name: string;
  display_id?: string;
};

export default function AdminCollectionsPage() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();
  const api = useApi();

  const [shops, setShops] = useState<Shop[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [collectionScope, setCollectionScope] = useState<"system" | "vendor">("system");
  const [selectedShopDisplayId, setSelectedShopDisplayId] = useState<string | null>(null);
  const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!auth) {
      router.push("/auth/login");
      return;
    }
    if (auth.role !== "admin") {
      router.push("/");
    }
  }, [auth, isLoading, router]);

  const loadShops = async () => {
    setIsLoadingShops(true);
    try {
      const rows = await api.admin.getShops();
      setShops(rows || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load shops";
      setFeedback(message);
    } finally {
      setIsLoadingShops(false);
    }
  };

  const loadCollections = async () => {
    setFeedback("");
    setIsLoadingCollections(true);
    try {
      if (collectionScope === "vendor") {
        if (!selectedShopDisplayId) {
          setCollections([]);
          return;
        }

        const [shopCols, systemCols] = await Promise.all([
          api.collections.list({ authenticated: true, kind: "shop", shop_display_id: selectedShopDisplayId }),
          api.collections.list({ authenticated: true, kind: "system", shop_display_id: selectedShopDisplayId }),
        ]);

        const combined = [
          ...(Array.isArray(shopCols) ? shopCols.map((item) => ({ ...item, source: "shop" as const })) : []),
          ...(Array.isArray(systemCols) ? systemCols.map((item) => ({ ...item, source: "system" as const })) : []),
        ];

        combined.sort((a, b) => {
          const aOrder = Number(a.homepage_order || 0);
          const bOrder = Number(b.homepage_order || 0);
          if (bOrder !== aOrder) return bOrder - aOrder;
          const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bDate - aDate || b.id - a.id;
        });

        setCollections(combined);
      } else {
        const cols = await api.collections.list({
          authenticated: true,
          kind: collectionScope === "system" ? "system" : "shop",
          shop_display_id: collectionScope === "vendor" ? selectedShopDisplayId || undefined : undefined,
        });
        setCollections(cols || []);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load collections";
      setFeedback(message);
    } finally {
      setIsLoadingCollections(false);
    }
  };


  useEffect(() => {
    if (isLoading || !auth || auth.role !== "admin") return;
    loadShops();
  }, [isLoading, auth]);

  useEffect(() => {
    if (isLoading || !auth || auth.role !== "admin") return;
    loadCollections();
  }, [isLoading, auth, collectionScope, selectedShopDisplayId]);

  const handleToggleHomepageDisplay = async (collectionId: number, displayOnHomepage: boolean) => {
    setFeedback("");
    try {
      await api.collections.toggleHomepageDisplay(collectionId, displayOnHomepage, collectionScope === "vendor" ? selectedShopDisplayId ?? undefined : undefined);
      await loadCollections();
      setFeedback("Homepage collection settings updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update homepage display";
      setFeedback(message);
    }
  };

  const handleOrderHomepageCollections = async (collectionIds: number[]) => {
    setFeedback("");
    try {
      await api.collections.orderHomepageCollections(collectionIds, collectionScope === "vendor" ? selectedShopDisplayId ?? undefined : undefined);
      await loadCollections();
      setFeedback("Homepage collection order updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update homepage order";
      setFeedback(message);
    }
  };

  if (isLoading) return null;
  if (!auth || auth.role !== "admin") return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Collections Management</h1>
          <p className="mt-1 text-sm text-slate-600">Manage system and vendor collections from one place.</p>

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div className="rounded border border-slate-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold">Create Collection</h2>
              <CollectionForm
                mode="create"
                onSaved={async () => {
                  setFeedback("Collection created.");
                  await loadCollections();
                }}
              />
              {feedback ? <p className="mt-2 text-sm text-slate-700">{feedback}</p> : null}
            </div>

            <div className="rounded border border-slate-200 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <label className="text-sm text-slate-600">Scope</label>
                <select
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                  value={collectionScope}
                  onChange={(e) => setCollectionScope(e.target.value as "system" | "vendor")}
                >
                  <option value="system">System</option>
                  <option value="vendor">Vendor</option>
                </select>

                {collectionScope === "vendor" && (
                  <>
                    <label className="text-sm text-slate-600">Shop</label>
                    <select
                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                      value={selectedShopDisplayId || ""}
                      onChange={(e) => setSelectedShopDisplayId(e.target.value || null)}
                    >
                      <option value="">-- select shop --</option>
                      {isLoadingShops ? <option>Loading...</option> : shops.map((s) => (
                        <option key={s.display_id || s.id} value={s.display_id}>
                          {s.name} ({s.display_id})
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>

              {isLoadingCollections ? <p className="text-sm text-slate-600">Loading collections...</p> : null}

              <CollectionsList
                collections={collections}
                editingCollectionId={editingCollectionId}
                scope={collectionScope}
                shopDisplayId={collectionScope === "vendor" ? selectedShopDisplayId || undefined : undefined}
                onEdit={(col) => setEditingCollectionId(col.id)}
                onCancelEdit={() => setEditingCollectionId(null)}
                onSaved={async () => {
                  setEditingCollectionId(null);
                  await loadCollections();
                }}
                onDeleted={async () => {
                  await loadCollections();
                }}
                showHomepageControls={collectionScope === "system" || collectionScope === "vendor"}
                onToggleHomepageDisplay={handleToggleHomepageDisplay}
                onOrderHomepageCollections={handleOrderHomepageCollections}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
