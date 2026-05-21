import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://konbini.cl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/cuenta/", "/crear/", "/login/", "/registro/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
