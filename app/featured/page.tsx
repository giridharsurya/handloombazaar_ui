import type { Metadata } from "next";
import FeaturedPageClient from "./FeaturedPageClient";
import { jsonLdScript, buildItemListJsonLd } from "@/lib/seo";
import { getApiBaseUrl } from "@/lib/apiClient";
import type { Collection, ProductFilterAttribute, ProductListItem } from "@/types/apiTypes";

export type FeaturedInitialData = {
  products: ProductListItem[];
  totalProducts: number;
  filterAttributes: ProductFilterAttribute[];
};

async function getFeaturedInitialData(): Promise<FeaturedInitialData> {
  const baseUrl = getApiBaseUrl();
  const [collectionsResponse, attributesResponse] = await Promise.all([
    fetch(`${baseUrl}/api/collections?kind=system`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/products/filters/attributes`, { cache: "no-store" }),
  ]);
  const collectionsPayload = collectionsResponse.ok ? await collectionsResponse.json() : { items: [] };
  const attributes = attributesResponse.ok ? await attributesResponse.json() : [];
  const collections = (collectionsPayload.items || collectionsPayload || []) as Collection[];
  const featured = collections.find((collection) => /featured/i.test(collection.name) || /featured/i.test(collection.display_id));
  if (!featured) return { products: [], totalProducts: 0, filterAttributes: attributes };

  const productsResponse = await fetch(`${baseUrl}/api/collections/${featured.id}/products?page=1&page_size=20&mode=view`, { cache: "no-store" });
  const productsPayload = productsResponse.ok ? await productsResponse.json() : null;
  const pageData = productsPayload?.data || productsPayload || {};
  return {
    products: (pageData.items || []).filter((item: ProductListItem) => item.is_active !== false),
    totalProducts: pageData.total_count || 0,
    filterAttributes: attributes,
  };
}

export const metadata: Metadata = {
  title: "Featured Mangalagiri Sarees | Andhra Pradesh Handloom Picks",
  description:
    "Discover featured Mangalagiri handloom sarees and Andhra Pradesh cotton weaves curated for heritage elegance, zari detailing, and authentic local craftsmanship.",
  alternates: {
    canonical: "/featured",
  },
  keywords: [
    "featured Mangalagiri sarees",
    "Andhra Pradesh handloom picks",
    "Mangalagiri cotton sarees",
    "curated Andhra Pradesh sarees",
    "handwoven heritage sarees",
    "Mangalagiri weavers",
  ],
};

export default async function FeaturedPage() {
  const initialData = await getFeaturedInitialData();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            buildItemListJsonLd({
              name: "Featured Mangalagiri Sarees",
              description: metadata.description || "Featured Mangalagiri handloom sarees and Andhra Pradesh cotton weaves from local weaving heritage.",
              url: "https://www.handloomstores.com/featured",
              itemCount: 0,
            })
          ),
        }}
      />
      <FeaturedPageClient initialData={initialData} />
    </>
  );
}
