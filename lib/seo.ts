import type { Metadata } from "next";

export function jsonLdScript(data: Record<string, unknown>) {
  return JSON.stringify(data);
}

export function buildWebSiteJsonLd({
  url,
  name = "Handloom Stores",
  description,
}: {
  url: string;
  name?: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    description: description || "Authentic Mangalagiri handloom sarees and Andhra Pradesh cotton weaves from trusted local weaving stores.",
    url,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: "Handloom Stores",
      url: "https://www.handloomstores.com",
      logo: "https://www.handloomstores.com/images/logo.png",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.handloomstores.com/sarees?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildItemListJsonLd({
  name,
  description,
  url,
  itemCount,
}: {
  name: string;
  description: string;
  url: string;
  itemCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description,
    url,
    numberOfItems: itemCount ?? 0,
  };
}

export function buildProductJsonLd({
  name,
  description,
  url,
  image,
  price,
  currency = "INR",
  brand,
  shopName,
}: {
  name: string;
  description?: string | null;
  url: string;
  image?: string | null;
  price?: number | null;
  currency?: string;
  brand?: string | null;
  shopName?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description || `${name} by ${shopName || brand || "Handloom Stores"} is an authentic Mangalagiri handloom saree from Andhra Pradesh.` ,
    image: image ? [image] : undefined,
    url,
    brand: {
      "@type": "Brand",
      name: brand || shopName || "Handloom Stores",
    },
    offers: price
      ? {
          "@type": "Offer",
          priceCurrency: currency,
          price,
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
        }
      : undefined,
    manufacturer: shopName
      ? {
          "@type": "Organization",
          name: shopName,
        }
      : undefined,
  };
}

export function buildShopJsonLd({
  name,
  description,
  url,
  city,
  address,
  telephone,
  sameAs,
  image,
}: {
  name: string;
  description?: string | null;
  url: string;
  city?: string | null;
  address?: string | null;
  telephone?: string | null;
  sameAs?: Array<string | null | undefined>;
  image?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name,
    description: description || `${name} offers authentic Mangalagiri handloom sarees and Andhra Pradesh cotton weaves from trusted local weaving traditions.`,
    url,
    image: image || undefined,
    telephone: telephone || undefined,
    address: address || city
      ? {
          "@type": "PostalAddress",
          addressLocality: city || undefined,
          streetAddress: address || undefined,
          addressCountry: "IN",
        }
      : undefined,
    sameAs: (sameAs || []).filter((value): value is string => Boolean(value)),
  };
}

export function buildCollectionJsonLd({
  name,
  description,
  url,
  image,
}: {
  name: string;
  description?: string | null;
  url: string;
  image?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description: description || `${name} is a curated Mangalagiri handloom collection celebrating Andhra Pradesh weaving heritage, cotton sarees, and handcrafted textile stories.`,
    url,
    image: image || undefined,
  };
}

const DEFAULT_API_BASE_URL = "http://localhost:8000";

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || process.env.API_BASE_URL?.replace(/\/$/, "") || DEFAULT_API_BASE_URL;
}

export function stripHtml(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function toMetadataText(value?: string | null, fallback = "") {
  const normalized = stripHtml(value);
  return normalized || fallback;
}

export function truncateText(value?: string | null, maxLength = 180) {
  const text = toMetadataText(value).trim();
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}

export function buildKeywordSet(values: Array<string | null | undefined>) {
  const keywords = new Set<string>();
  values.forEach((value) => {
    const text = stripHtml(value || "").trim();
    if (!text) return;
    const tokens = text
      .split(/[^a-zA-Z0-9\u0900-\u097F]+/)
      .map((token) => token.trim())
      .filter(Boolean);
    tokens.forEach((token) => {
      if (token.length > 2) keywords.add(token);
    });
  });
  return Array.from(keywords).slice(0, 20);
}

export function buildEntityMetadata({
  title,
  description,
  path,
  keywords,
  ogImage,
}: {
  title: string;
  description?: string | null;
  path: string;
  keywords?: Array<string | null | undefined>;
  ogImage?: string | null;
}): Metadata {
  const safeDescription = truncateText(description, 180) || "Explore authentic Mangalagiri handloom sarees and Andhra Pradesh cotton weaves from trusted local weaving stores.";
  const keywordList = [...new Set(
    [
      ...(keywords || []).filter((value): value is string => typeof value === "string" && value.trim().length > 0),
      "Mangalagiri handloom sarees",
      "Andhra Pradesh handloom sarees",
      "Mangalagiri cotton sarees",
      "Andhra Pradesh handloom stores",
      "Mangalagiri weavers",
      "handwoven sarees",
    ]
      .flatMap((value) => value.split(/[,/|]+/))
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
  )].slice(0, 25);

  return {
    title,
    description: safeDescription,
    keywords: keywordList,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description: safeDescription,
      type: "website",
      siteName: "Handloom Stores",
      url: path,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export async function fetchPublicJson<T>(path: string): Promise<T> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}${path}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
}
