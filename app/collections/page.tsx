import type { Metadata } from "next";
import CollectionsPageClient from "./CollectionsPageClient";
import { jsonLdScript, buildItemListJsonLd } from "@/lib/seo";
import { getApiBaseUrl } from "@/lib/apiClient";
import type { Collection, ProductListItem } from "@/types/apiTypes";

export type CollectionsInitialData = {
  collections: Collection[];
  collectionMembers: Record<number, (ProductListItem & { id: string })[]>;
  totalCollections: number;
};

async function getCollectionsInitialData(): Promise<CollectionsInitialData> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/collections?kind=system&sort_by=newest&view_count=true&page=1&page_size=20`, { cache: "no-store" });
  const payload = response.ok ? await response.json() : { items: [], total_count: 0 };
  const collections = (payload.items || []) as Collection[];
  const entries = await Promise.all(collections.map(async (collection) => {
    try {
      const productsResponse = await fetch(`${baseUrl}/api/collections/${collection.id}/products?page=1&page_size=20`, { cache: "no-store" });
      const productsPayload = productsResponse.ok ? await productsResponse.json() : null;
      const items = (productsPayload?.data?.items || productsPayload?.items || [])
        .filter((item: ProductListItem) => item.is_active !== false)
        .map((item: ProductListItem) => ({ ...item, id: String(item.display_id) }));
      return [collection.id, items] as const;
    } catch {
      return [collection.id, []] as const;
    }
  }));
  return { collections, collectionMembers: Object.fromEntries(entries), totalCollections: payload.total_count || 0 };
}

export const metadata: Metadata = {
  title: "Mangalagiri Collections | Andhra Pradesh Handloom Textile Stories",
  description:
    "Browse curated Mangalagiri handloom collections and Andhra Pradesh textile stories featuring authentic sarees, cotton weaves, and heritage craftsmanship.",
  alternates: {
    canonical: "/collections",
  },
  keywords: [
    "Mangalagiri collections",
    "Andhra Pradesh handloom collections",
    "Mangalagiri saree collection",
    "handwoven cotton collections",
    "heritage saree collection",
    "Mangalagiri weaving stories",
  ],
};

export default async function CollectionsPage() {
  const initialData = await getCollectionsInitialData();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            buildItemListJsonLd({
              name: "Mangalagiri Collections",
              description: metadata.description || "Curated Mangalagiri handloom collections and Andhra Pradesh textile stories for heritage cotton sarees.",
              url: "https://www.handloomstores.com/collections",
              itemCount: 0,
            })
          ),
        }}
      />
      <CollectionsPageClient initialData={initialData} />
    </>
  );
}
