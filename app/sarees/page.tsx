import type { Metadata } from "next";
import { Suspense } from "react";
import SareesPageContent from "./SareesPageContent";
import { jsonLdScript, buildItemListJsonLd } from "@/lib/seo";
import { getApiBaseUrl } from "@/lib/apiClient";
import type { ProductFilterAttribute, ProductListItem } from "@/types/apiTypes";

export type SareesInitialData = {
  products: ProductListItem[];
  totalProducts: number;
  filterAttributes: ProductFilterAttribute[];
};

async function getSareesInitialData(searchParams: Record<string, string | string[] | undefined>): Promise<SareesInitialData> {
  const baseUrl = getApiBaseUrl();
  const query = new URLSearchParams({ page: "1", page_size: "20", sort_by: "newest" });
  const appendParam = (key: string) => {
    const value = searchParams[key];
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value) query.set(key, value);
  };
  ["collection_id", "shop_display_id", "product_group_id", "search"].forEach(appendParam);
  const attributeFilters = searchParams.attribute_filters;
  if (Array.isArray(attributeFilters)) attributeFilters.forEach((item) => query.append("attribute_filters", item));
  else if (attributeFilters) query.append("attribute_filters", attributeFilters);
  const [productsResponse, attributesResponse] = await Promise.all([
    fetch(`${baseUrl}/api/products?${query.toString()}`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/products/filters/attributes`, { cache: "no-store" }),
  ]);
  const productsPayload = productsResponse.ok ? await productsResponse.json() : null;
  const attributes = attributesResponse.ok ? await attributesResponse.json() : [];
  const pageData = productsPayload?.data || productsPayload || {};
  return {
    products: pageData.items || [],
    totalProducts: pageData.total_count || 0,
    filterAttributes: attributes,
  };
}

export const metadata: Metadata = {
  title: "Mangalagiri Handloom Sarees | Andhra Pradesh Cotton Weaves",
  description:
    "Browse authentic Mangalagiri handloom sarees from Andhra Pradesh, featuring fine cotton weaves, zari borders, and timeless handwoven heritage.",
  alternates: {
    canonical: "/sarees",
  },
};

export default async function SareesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const initialData = await getSareesInitialData(await searchParams);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            buildItemListJsonLd({
              name: "Handloom Sarees",
              description: metadata.description || "Authentic handloom sarees and artisan textiles.",
              url: "https://www.handloomstores.com/sarees",
              itemCount: 0,
            })
          ),
        }}
      />
      <Suspense fallback={null}>
        <SareesPageContent initialData={initialData} />
      </Suspense>
    </>
  );
}
