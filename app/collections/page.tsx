"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/ApiProvider";
import { useAuth } from "@/lib/AuthContext";
import FilterHeader from "@/components/FilterHeader/FilterHeader";
import Pagination from "@/components/Product/Pagination";
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
  const [sortBy, setSortBy] = useState<"newest" | "most-viewed" | "product-count">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCollections, setTotalCollections] = useState(0);
  const itemsPerPage = 8;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleSortChange = (sort: "price-low" | "price-high" | "newest" | "most-viewed" | "product-count") => {
    if (sort === "newest" || sort === "most-viewed" || sort === "product-count") {
      setSortBy(sort);
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.collections.listPage({
          kind: "system",
          authenticated: false,
          sort_by: sortBy,
          view_count: true,
          page: currentPage,
          page_size: itemsPerPage,
        });
        if (cancelled) return;
        const nextCollections = (response?.items || []) as Collection[];
        setCollections(nextCollections);
        setTotalCollections(response?.total_count || 0);

        const ribbonEntries = await Promise.all(
          nextCollections.map(async (collection) => {
            try {
              const pageData = await api.collections.getProductsPage(collection.id, {
                authenticated: false,
                page: 1,
                page_size: 12,
              });
              const items = (pageData?.items || []) as ProductListItem[];
              const normalizedItems = items
                .filter((item) => item.is_active !== false)
                .map((item) => ({
                  ...item,
                  id: String(item.display_id),
                }));
              return [collection.id, normalizedItems] as const;
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
  }, [api, isAdmin, sortBy, currentPage]);

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
      <div className="mx-auto w-full">
        <FilterHeader
          pageTitle="Collections"
          productCount={totalCollections}
          showFiltersToggle={false}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          sortOptions={[
            { value: "newest", label: "Newest" },
            { value: "most-viewed", label: "Most Viewed" },
            { value: "product-count", label: "Most Products" },
          ]}
          isSticky={false}
        />
        {loading ? <p className="text-sm text-slate-600">Loading collections...</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        {!loading && !error ? (
          <>
            <section className="space-y-4 px-4 py-4">
              {ribbonRows.map((row) => (
                <div key={row.collection.id}>
                  <Ribbon
                    title={row.collection.name}
                    action={
                      <Link href={`/collections/${row.collection.id}`} className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-slate-100">
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
                  {row.items.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">No products yet in this collection.</p>
                  ) : null}
                </div>
              ))}
            </section>
            <Pagination currentPage={currentPage} totalItems={totalCollections} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
          </>
        ) : null}

        {!loading && !error && ribbonRows.length === 0 ? (
          <p className="text-sm text-slate-600">No system collections found.</p>
        ) : null}
      </div>
    </main>
  );
}
