import type { Metadata } from "next";
import FeaturedPageClient from "./FeaturedPageClient";
import { jsonLdScript, buildItemListJsonLd } from "@/lib/seo";

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

export default function FeaturedPage() {
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
      <FeaturedPageClient />
    </>
  );
}
