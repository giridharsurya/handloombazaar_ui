import type { Metadata } from "next";
import SareeDetailsPageClient from "./SareeDetailsPageClient";
import { buildEntityMetadata, fetchPublicJson, truncateText, buildKeywordSet, jsonLdScript, buildProductJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const payload = await fetchPublicJson<{ product: { name: string; description?: string | null; price?: number | null; image_url?: string | null; shop?: { name?: string; display_id?: string; city?: string | null; address?: string | null }; attributes?: Array<{ name?: string; value?: string }> } }>(`/api/products/${encodeURIComponent(id)}`);
    const product = payload.product;

    const attributeTerms = (product.attributes || []).map((attribute) => `${attribute.name || ""} ${attribute.value || ""}`);
    const keywords = buildKeywordSet([
      product.name,
      product.description,
      product.shop?.name,
      ...attributeTerms,
      "handloom saree",
      "artisan textile",
      "handwoven product",
    ]);

    const title = `${product.name} | Mangalagiri Handloom Saree`;
    const description = truncateText(
      product.description || `${product.name} by ${product.shop?.name || "Handloom Stores"} is a handcrafted Mangalagiri handloom saree from Andhra Pradesh with timeless cotton weaving heritage.`,
      180,
    );

    return buildEntityMetadata({
      title,
      description,
      path: `/sarees/${encodeURIComponent(id)}`,
      keywords: [
        ...keywords,
        "Mangalagiri handloom saree",
        "Andhra Pradesh handloom sarees",
        "Mangalagiri cotton saree",
      ],
    });
  } catch {
    return {
      title: "Mangalagiri Handloom Saree | Andhra Pradesh",
      description: "Browse authentic Mangalagiri handloom sarees and Andhra Pradesh cotton weaves from trusted local weaving stores.",
    };
  }
}

export default async function SareeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await fetchPublicJson<{ product: { name: string; description?: string | null; price?: number | null; image_url?: string | null; shop?: { name?: string; display_id?: string; city?: string | null; address?: string | null }; attributes?: Array<{ name?: string; value?: string }> } }>(`/api/products/${encodeURIComponent(id)}`);
    const product = payload.product;
    const productUrl = `https://www.handloomstores.com/sarees/${encodeURIComponent(id)}`;

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(
              buildProductJsonLd({
                name: product.name,
                description: product.description,
                url: productUrl,
                image: product.image_url,
                price: product.price,
                brand: product.shop?.name,
                shopName: product.shop?.name,
              })
            ),
          }}
        />
        <SareeDetailsPageClient />
      </>
    );
  } catch {
    return <SareeDetailsPageClient />;
  }
}
