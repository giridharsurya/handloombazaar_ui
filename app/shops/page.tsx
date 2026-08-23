import type { Metadata } from "next";
import ShopsPageContent from "./ShopsPageContent";
import { jsonLdScript, buildItemListJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mangalagiri Handloom Stores | Andhra Pradesh Weaving Shops",
  description:
    "Discover Mangalagiri handloom stores and Andhra Pradesh weaving shops offering handcrafted cotton sarees, heritage designs, and authentic local craftsmanship.",
  alternates: {
    canonical: "/shops",
  },
};

export default function ShopsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            buildItemListJsonLd({
              name: "Mangalagiri Handloom Stores",
              description: metadata.description || "Curated Mangalagiri handloom stores and Andhra Pradesh weaving shops for authentic cotton sarees.",
              url: "https://www.handloomstores.com/shops",
              itemCount: 0,
            })
          ),
        }}
      />
      <ShopsPageContent />
    </>
  );
}
