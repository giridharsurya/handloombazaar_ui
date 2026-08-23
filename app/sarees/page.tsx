import type { Metadata } from "next";
import { Suspense } from "react";
import SareesPageContent from "./SareesPageContent";
import { jsonLdScript, buildItemListJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mangalagiri Handloom Sarees | Andhra Pradesh Cotton Weaves",
  description:
    "Browse authentic Mangalagiri handloom sarees from Andhra Pradesh, featuring fine cotton weaves, zari borders, and timeless handwoven heritage.",
  alternates: {
    canonical: "/sarees",
  },
};

export default function SareesPage() {
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
        <SareesPageContent />
      </Suspense>
    </>
  );
}
