import type { Metadata } from "next";
import HomePageContent from "./HomePageContent";
import { jsonLdScript, buildWebSiteJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mangalagiri Handloom Sarees | Andhra Pradesh Weaves",
  description:
    "Explore authentic Mangalagiri handloom sarees from Andhra Pradesh, handcrafted cotton weaves, and trusted local weaving stores known for heritage sarees.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
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
      <HomePageContent />
    </>
  );
}
