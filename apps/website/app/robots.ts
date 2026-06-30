import type { MetadataRoute } from "next";
import { BLOCK_INDEXING } from "@/lib/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://konbini.cl";

// force-dynamic: se evalúa por request, así respeta BLOCK_INDEXING en runtime.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // Sitio no listo: bloquear a todos los crawlers.
  if (BLOCK_INDEXING) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

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
