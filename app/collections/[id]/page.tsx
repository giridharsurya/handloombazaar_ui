import type { Metadata } from "next";
import CollectionPageClient from "./CollectionPageClient";
import { buildEntityMetadata, fetchPublicJson, truncateText, jsonLdScript, buildCollectionJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const collectionId = Number(id);
    if (!Number.isFinite(collectionId)) {
      throw new Error("Invalid collection id");
    }

    const collections = await fetchPublicJson<Array<{ id: number; name: string; description?: string | null; display_id?: string }>>(`/api/collections?kind=system`);
    const collection = collections.find((item) => item.id === collectionId || item.display_id === id) || null;

    if (!collection) {
      throw new Error("Collection not found");
    }

    const title = `${collection.name} | Mangalagiri Handloom Collection`;
    const description = truncateText(
      collection.description || `Explore ${collection.name}, a curated Mangalagiri handloom collection celebrating Andhra Pradesh weaving heritage, cotton sarees, and handcrafted textile stories.`,
      180,
    );

    return buildEntityMetadata({
      title,
      description,
      path: `/collections/${encodeURIComponent(id)}`,
      keywords: [collection.name, "Mangalagiri handloom collection", "Andhra Pradesh handloom sarees", "Mangalagiri cotton collection", "heritage saree collection"],
    });
  } catch {
    return {
      title: "Mangalagiri Collection | Andhra Pradesh",
      description: "Explore authentic Mangalagiri collections and Andhra Pradesh handloom textile stories.",
    };
  }
}

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const collectionId = Number(id);
    if (!Number.isFinite(collectionId)) {
      throw new Error("Invalid collection id");
    }

    const collections = await fetchPublicJson<Array<{ id: number; name: string; description?: string | null; display_id?: string; image_url?: string | null }>>(`/api/collections?kind=system`);
    const collection = collections.find((item) => item.id === collectionId || item.display_id === id) || null;

    if (!collection) {
      throw new Error("Collection not found");
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(
              buildCollectionJsonLd({
                name: collection.name,
                description: collection.description,
                url: `https://www.handloomstores.com/collections/${encodeURIComponent(id)}`,
                image: collection.image_url,
              })
            ),
          }}
        />
        <CollectionPageClient />
      </>
    );
  } catch {
    return <CollectionPageClient />;
  }
}
