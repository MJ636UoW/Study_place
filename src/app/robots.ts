import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sanctuary-residences.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/plans",
          "/book",
          "/conduct",
          "/contact",
          "/privacy",
          "/terms",
          "/refund-policy",
          "/reviews",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/dashboard",
          "/dashboard/*",
          "/auth/*",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
