import type { MetadataRoute } from "next";

const baseUrl = "https://www.handloomstores.com";

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
      fetch(`${baseUrl}/api/shops`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/collections?kind=system`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/products?page=1&page_size=200`, { cache: "no-store" }),
    ]);

    if (shopsResponse.ok) {
      const shops = await shopsResponse.json();
      const items = Array.isArray(shops?.items) ? shops.items : Array.isArray(shops) ? shops : [];
      items.forEach((shop: any) => {
        if (shop?.display_id) {
          publicEntries.push({
            url: `${baseUrl}/shops/${encodeURIComponent(shop.display_id)}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
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
