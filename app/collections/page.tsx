"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/ApiProvider";
import { useAuth } from "@/lib/AuthContext";
import Ribbon from "@/components/Ribbon/Ribbon";
import Product from "@/components/Product/Product";
import type { Collection, ProductListItem } from "@/types/apiTypes";

type RibbonProduct = ProductListItem & { id: string };

type CollectionRibbonRow = {
  collection: Collection;
  items: RibbonProduct[];
};

export default function SystemCollectionsPage() {
  const api = useApi();
  const { auth } = useAuth();
  const isAdmin = auth?.role === "admin";

  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionMembers, setCollectionMembers] = useState<Record<number, RibbonProduct[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await api.collections.list({
          kind: "system",
          authenticated: isAdmin,
        });
        if (cancelled) return;
        const nextCollections = (rows || []) as Collection[];
        setCollections(nextCollections);

        const catalog = await api.products.getProducts({
          page: 1,
          page_size: 100,
          authenticated: isAdmin,
        });

        const publicCatalog = isAdmin
          ? (catalog || [])
          : (catalog || []).filter((p) => p.is_active !== false && Number(p.stock_quantity ?? 0) > 0);
        const catalogByDisplayId = new Map(publicCatalog.map((p) => [String(p.display_id), p]));

        const ribbonEntries = await Promise.all(
          nextCollections.map(async (collection) => {
            try {
              const membersResponse = await api.collections.getProducts(collection.id, {
                authenticated: isAdmin,
              });
              const memberRows = (membersResponse?.items || membersResponse || []) as Array<{ display_id: string }>;
              const items = memberRows
                .map((item) => catalogByDisplayId.get(String(item.display_id)))
                .filter((item): item is ProductListItem => !!item)
                .slice(0, 12)
                .map((item) => ({ ...item, id: String(item.display_id) }));
              return [collection.id, items] as const;
            } catch {
              return [collection.id, [] as RibbonProduct[]] as const;
            }
          })
        );

        if (cancelled) return;
        setCollectionMembers(Object.fromEntries(ribbonEntries));
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load collections";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [api, isAdmin]);

  const visibleCollections = useMemo(() => {
    if (isAdmin) return collections;
    return collections.filter((c) => c.is_active);
  }, [collections, isAdmin]);

  const ribbonRows = useMemo<CollectionRibbonRow[]>(() => {
    return visibleCollections.map((collection) => ({
      collection,
      items: collectionMembers[collection.id] || [],
    }));
  }, [visibleCollections, collectionMembers]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? <p className="text-sm text-slate-600">Loading collections...</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        {!loading && !error ? (
          <section className="space-y-4">
            {ribbonRows.map((row) => (
              <div key={row.collection.id}>
                <Ribbon
                  title={row.collection.name}
                  action={
                    <Link href={`/collections/${row.collection.id}`} className="text-sm text-rose-600 hover:underline">
                      View all
                    </Link>
                  }
                  items={row.items}
                  renderItem={(product: RibbonProduct) => (
                    <Product product={product} size="compact" hideShop={true} />
                  )}
                />
                {row.items.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">No products yet in this collection.</p>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}

        {!loading && !error && ribbonRows.length === 0 ? (
          <p className="text-sm text-slate-600">No system collections found.</p>
        ) : null}
      </div>
    </main>
  );
}
