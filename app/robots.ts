import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/auth",
        "/vendor",
        "/api/",
        "/_next/",
      ],
    },
    sitemap: "https://www.handloomstores.com/sitemap.xml",
  };
}
