import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ShopPageClient from "./ShopPageClient";
import { buildEntityMetadata, fetchPublicJson, truncateText, jsonLdScript, buildShopJsonLd } from "@/lib/seo";
import type { AnnouncementBanner, ProductFilterAttribute, ProductListItem, ProductsResponse, ShopDetail, PaginatedCollectionsResponse } from "@/types/apiTypes";
import type { CollectionMemberItem, ShopCollectionItem, ShopDetailsInitialData } from "@/components/Shop/ShopDetailsPage";

type ShopPageData = ShopDetail & {
  shop_logo_url?: string;
  approved?: boolean;
  is_active?: boolean;
};

async function fetchShopOverviewData(shopId: string): Promise<ShopDetailsInitialData> {
  const [shopCollections, systemCollections, announcements, filterAttributes] = await Promise.all([
    fetchPublicJson<PaginatedCollectionsResponse>(`/api/collections?kind=shop&shop_display_id=${encodeURIComponent(shopId)}&sort_by=newest&view_count=true&page=1&page_size=100`),
    fetchPublicJson<PaginatedCollectionsResponse>(`/api/collections?kind=system&shop_display_id=${encodeURIComponent(shopId)}&sort_by=newest&view_count=true&page=1&page_size=100`),
    fetchPublicJson<{ items?: AnnouncementBanner[] }>(`/api/announcements?shop_display_id=${encodeURIComponent(shopId)}`),
    fetchPublicJson<ProductFilterAttribute[]>("/api/products/filters/attributes"),
  ]);

  const collectionRows: Array<ShopCollectionItem & { source: "shop" | "system" }> = [
    ...(shopCollections.items || []).map((item) => ({ ...item, source: "shop" as const })),
    ...(systemCollections.items || []).map((item) => ({ ...item, source: "system" as const })),
  ];
  const collectionMembers: Record<string, CollectionMemberItem[]> = {};
  const collectionsWithProducts = await Promise.all(collectionRows.map(async (collectionItem) => {
    try {
      const pageData = await fetchPublicJson<ProductsResponse>(
        `/api/collections/${collectionItem.id}/products?page=1&page_size=20&shop_display_id=${encodeURIComponent(shopId)}&mode=view&track_view=false`,
      );
      const items = pageData.data?.items || [];
      const collectionKey = `${collectionItem.source}:${collectionItem.id}`;
      collectionMembers[collectionKey] = items.map((item) => ({
        ...item,
        id: `${collectionItem.source}-${collectionItem.id}-${item.display_id}`,
      }));
      return items.length > 0 ? collectionItem : null;
    } catch {
      // A collection that cannot be read should not prevent the shop page from rendering.
      return null;
    }
  }));

  const collections = collectionsWithProducts.filter((item): item is ShopCollectionItem => item !== null);

  return { collections, collectionMembers, announcements: announcements.items || [], filterAttributes };
}

async function fetchShopPageData(id: string): Promise<{ shop: ShopPageData; products: ProductListItem[]; initialData: ShopDetailsInitialData }> {
  const shop = await fetchPublicJson<ShopPageData>(`/api/shops/${encodeURIComponent(id)}`);
  const [productsResponse, initialData] = await Promise.all([
    fetchPublicJson<ProductsResponse>(
    `/api/products?page=1&page_size=20&shop_display_id=${encodeURIComponent(shop.display_id)}`,
    ),
    fetchShopOverviewData(shop.display_id),
  ]);

  return {
    shop,
    products: productsResponse.data?.items || [],
    initialData,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const shop = await fetchPublicJson<{ name: string; description?: string | null; city?: string | null; address?: string | null; website_url?: string | null; phone_number?: string | null; instagram_url?: string | null; facebook_url?: string | null; youtube_url?: string | null; email?: string | null; shop_slug?: string | null; approved?: boolean; is_active?: boolean }> (`/api/shops/${encodeURIComponent(id)}`);
    const canonicalSlug = shop.shop_slug || id;
    const canonicalPath = `/shops/${encodeURIComponent(canonicalSlug)}`;
    const isPublicShop = Boolean(shop.approved && shop.is_active && shop.shop_slug);

    const title = `${shop.name} | Mangalagiri Handloom Store`;
    const description = truncateText(
      shop.description || `${shop.name} in ${shop.city || "Andhra Pradesh"} offers authentic Mangalagiri handloom sarees, cotton weaves, and heritage craftsmanship from local weaving traditions.`,
      180,
    );

    return buildEntityMetadata({
      title,
      description,
      path: canonicalPath,
      keywords: [
        shop.name,
        shop.city,
        shop.address,
        "Mangalagiri handloom store",
        "Andhra Pradesh weaving shop",
        "Mangalagiri cotton sarees",
        "handwoven sarees from Andhra Pradesh",
        shop.instagram_url,
        shop.website_url,
      ],
      robots: isPublicShop ? undefined : { index: false, follow: false },
    });
  } catch {
    return {
      title: "Mangalagiri Handloom Store | Andhra Pradesh",
      description: "Explore authentic Mangalagiri handloom stores and Andhra Pradesh weaving shops for handcrafted cotton sarees.",
      robots: { index: false, follow: false },
    };
  }
}

export default async function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { shop, products, initialData } = await fetchShopPageData(id);

    if (!shop.approved || !shop.is_active || !shop.shop_slug) {
      return <ShopPageClient />;
    }

    if (shop.shop_slug && shop.shop_slug !== id) {
      redirect(`/shops/${encodeURIComponent(shop.shop_slug)}`);
    }

    const shopUrl = `https://www.handloomstores.com/shops/${encodeURIComponent(shop.shop_slug || id)}`;

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(
              buildShopJsonLd({
                name: shop.name,
                description: shop.description,
                url: shopUrl,
                city: shop.city,
                address: shop.address,
                telephone: shop.phone_number,
                sameAs: [shop.instagram_url, shop.facebook_url, shop.youtube_url, shop.website_url],
                image: shop.shop_logo_url,
              })
            ),
          }}
        />
        <ShopPageClient initialShop={shop} initialProducts={products} initialData={initialData} />
      </>
    );
  } catch {
    return <ShopPageClient />;
  }
}
