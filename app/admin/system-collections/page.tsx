"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function AdminSystemCollectionsPage() {
  const api = useApi();
  const { auth, isLoading } = useAuth();
  const router = useRouter();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionMembers, setCollectionMembers] = useState<Record<number, RibbonProduct[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    if (!auth || auth.role !== "admin") return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const rows = (await api.collections.list({ kind: "system", authenticated: true })) as Collection[];
        if (cancelled) return;
        setCollections(rows || []);

        const ribbonEntries = await Promise.all(
          (rows || []).map(async (collection) => {
            try {
              const membersResponse = await api.collections.getProducts(collection.id, { authenticated: true });
              const memberRows = (membersResponse?.items || membersResponse || []) as ProductListItem[];
              const items = memberRows
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
        const msg = err instanceof Error ? err.message : "Failed to load system collections";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [api, auth]);

  const ribbonRows = useMemo<CollectionRibbonRow[]>(() => {
    return collections.map((collection) => ({
      collection,
      items: collectionMembers[collection.id] || [],
    }));
  }, [collections, collectionMembers]);

  if (isLoading) return null;
  if (!auth || auth.role !== "admin") return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">

        {loading ? <p className="text-sm text-slate-600">Loading collections...</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        {!loading && !error ? (
          <section className="space-y-4">
            {ribbonRows.map((row) => (
              <div key={row.collection.id}>
                <Ribbon
                  title={row.collection.name}
                  action={
                    <Link href={`/admin/system-collections/${row.collection.id}`} className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-slate-100">
                      View all
                    </Link>
                  }
                  items={row.items}
                  renderItem={(product: RibbonProduct) => (
                    <div className="min-w-[12.5rem]">
                      <Product product={product} size="default" hideShop={true} />
                    </div>
                  )}
                  className="!mx-0 !rounded-3xl !border !border-slate-200 !shadow-sm !py-6 !px-6"
                />
                {!row.collection.is_active ? (
                  <p className="mt-2 text-xs font-medium text-amber-700">This collection is currently inactive.</p>
                ) : null}
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
