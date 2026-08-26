import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ShopPageClient from "./ShopPageClient";
import { buildEntityMetadata, fetchPublicJson, truncateText, jsonLdScript, buildShopJsonLd } from "@/lib/seo";

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
    const shop = await fetchPublicJson<{ name: string; description?: string | null; city?: string | null; address?: string | null; website_url?: string | null; phone_number?: string | null; instagram_url?: string | null; facebook_url?: string | null; youtube_url?: string | null; email?: string | null; shop_slug?: string | null; shop_logo_url?: string | null; approved?: boolean; is_active?: boolean }> (`/api/shops/${encodeURIComponent(id)}`);

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
        <ShopPageClient />
      </>
    );
  } catch {
    return <ShopPageClient />;
  }
}
