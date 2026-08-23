import type { Metadata } from "next";
import CollectionsPageClient from "./CollectionsPageClient";
import { jsonLdScript, buildItemListJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mangalagiri Collections | Andhra Pradesh Handloom Textile Stories",
  description:
    "Browse curated Mangalagiri handloom collections and Andhra Pradesh textile stories featuring authentic sarees, cotton weaves, and heritage craftsmanship.",
  alternates: {
    canonical: "/collections",
  },
  keywords: [
    "Mangalagiri collections",
    "Andhra Pradesh handloom collections",
    "Mangalagiri saree collection",
    "handwoven cotton collections",
    "heritage saree collection",
    "Mangalagiri weaving stories",
  ],
};

export default function CollectionsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            buildItemListJsonLd({
              name: "Mangalagiri Collections",
              description: metadata.description || "Curated Mangalagiri handloom collections and Andhra Pradesh textile stories for heritage cotton sarees.",
              url: "https://www.handloomstores.com/collections",
              itemCount: 0,
            })
          ),
        }}
      />
      <CollectionsPageClient />
    </>
  );
}
