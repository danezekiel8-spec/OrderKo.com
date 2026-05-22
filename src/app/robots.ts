import type { MetadataRoute } from "next";

const siteUrl = process.env.ORDERKO_QR_BASE_URL?.replace(/\/$/, "") || "https://orderko.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/k", "/order", "/staff", "/super-admin"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
