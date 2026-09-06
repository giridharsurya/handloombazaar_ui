import type { MetadataRoute } from "next";
import { getApiBaseUrl } from "@/lib/apiClient";

const baseUrl = "https://www.handloomstores.com";
const apiBaseUrl = getApiBaseUrl();

async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const publicEntries: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/sarees`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/featured`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/shops`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/collections`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  try {
    const [shopsResponse, collectionsResponse, productsResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/api/shops?page=1&page_size=100`, { cache: "no-store" }),
      fetch(`${apiBaseUrl}/api/collections?kind=system`, { cache: "no-store" }),
      fetch(`${apiBaseUrl}/api/products?page=1&page_size=200`, { cache: "no-store" }),
    ]);

    if (shopsResponse.ok) {
      const firstPage = await shopsResponse.json();
      const shopPages = [firstPage];

      for (let page = 2; firstPage?.has_next; page += 1) {
        const pageResponse = await fetch(`${apiBaseUrl}/api/shops?page=${page}&page_size=100`, { cache: "no-store" });
        if (!pageResponse.ok) break;
        const nextPage = await pageResponse.json();
        shopPages.push(nextPage);
        if (!nextPage?.has_next) break;
      }

      shopPages.forEach((shops) => {
        const items = Array.isArray(shops?.items) ? shops.items : Array.isArray(shops) ? shops : [];
        items.forEach((shop: any) => {
          const shopSlug = shop?.shop_slug;
          if (shopSlug) {
            publicEntries.push({
              url: `${baseUrl}/shops/${encodeURIComponent(shopSlug)}`,
              lastModified: new Date(),
              changeFrequency: "weekly",
              priority: 0.7,
            });
          }
        });
      });
    }

    if (collectionsResponse.ok) {
      const collections = await collectionsResponse.json();
      const items = Array.isArray(collections?.items) ? collections.items : Array.isArray(collections) ? collections : [];
      items.forEach((collection: any) => {
        if (collection?.id !== undefined) {
          publicEntries.push({
            url: `${baseUrl}/collections/${encodeURIComponent(String(collection.id))}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
      });
    }

    if (productsResponse.ok) {
      const products = await productsResponse.json();
      const items = Array.isArray(products?.data?.items) ? products.data.items : Array.isArray(products?.items) ? products.items : [];
      items.forEach((product: any) => {
        if (product?.display_id) {
          publicEntries.push({
            url: `${baseUrl}/sarees/${encodeURIComponent(product.display_id)}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
      });
    }
  } catch {
    // ignore sitemap fetch failures; static public routes remain indexed
  }

  return publicEntries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemapEntries();
}
