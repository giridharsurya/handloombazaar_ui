import type { Metadata } from "next";
import HomePageContent from "./HomePageContent";
import { getApiBaseUrl, jsonLdScript, buildWebSiteJsonLd } from "@/lib/seo";
import type { AnnouncementBanner, Collection, ProductListItem, ProductsResponse, ShopStatusResponse } from "@/types/apiTypes";

export type HomepageData = {
  shops: Array<Pick<ShopStatusResponse, "display_id" | "name" | "shop_logo_url"> & { shop_slug?: string }>;
  announcements: AnnouncementBanner[];
  homepageRibbonRows: Array<{ collection: Collection; items: ProductListItem[] }>;
  latestProducts: ProductListItem[];
};

async function fetchHomepageData(): Promise<HomepageData> {
  const apiBaseUrl = getApiBaseUrl();
  const [shopsResponse, announcementsResponse, collectionsResponse, productsResponse] = await Promise.all([
    fetch(`${apiBaseUrl}/api/shops?sort_by=newest&page=1&page_size=20`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    }),
    fetch(`${apiBaseUrl}/api/announcements`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    }),
    fetch(`${apiBaseUrl}/api/collections?kind=system&display_on_homepage=true`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    }),
    fetch(`${apiBaseUrl}/api/products?page=1&page_size=20`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    }),
  ]);

  const shopsPayload = shopsResponse.ok ? await shopsResponse.json() : { items: [] };
  const announcementsPayload = announcementsResponse.ok ? await announcementsResponse.json() : { items: [] };
  const collectionsPayload = collectionsResponse.ok ? await collectionsResponse.json() : { items: [] };
  const productsPayload: ProductsResponse = productsResponse.ok ? await productsResponse.json() : { success: false, message: "", data: { items: [], page: 1, page_size: 20, total_count: 0, has_next: false } };

  const shops = (shopsPayload.items || [])
    .filter((shop: ShopStatusResponse) => Boolean(shop.shop_slug))
    .map((shop: ShopStatusResponse) => ({
      display_id: shop.display_id,
      shop_slug: shop.shop_slug,
      name: shop.name,
      shop_logo_url: shop.shop_logo_url,
    }));
  const collections = (collectionsPayload.items || []) as Collection[];
  const homepageRibbonRows = await Promise.all(
    collections.map(async (collection) => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/collections/${collection.id}/products?page=1&page_size=20`,
          { cache: "no-store", headers: { Accept: "application/json" } },
        );
        const payload = response.ok ? await response.json() : null;
        return { collection, items: (payload?.data?.items || payload?.items || []).filter((item: ProductListItem) => item.is_active !== false) };
      } catch {
        return { collection, items: [] };
      }
    }),
  );

  return {
    shops,
    announcements: (announcementsPayload.items || []).filter((item: AnnouncementBanner) => item.banner_scope === "system"),
    homepageRibbonRows,
    latestProducts: productsPayload.data?.items || [],
  };
}

export const metadata: Metadata = {
  title: "Mangalagiri Handloom Sarees | Andhra Pradesh Weaves",
  description:
    "Explore authentic Mangalagiri handloom sarees from Andhra Pradesh, handcrafted cotton weaves, and trusted local weaving stores known for heritage sarees.",
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const homepageData = await fetchHomepageData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            buildWebSiteJsonLd({ url: "https://www.handloomstores.com/", description: metadata.description || undefined })
          ),
        }}
      />
      <HomePageContent initialData={homepageData} />
    </>
  );
}
