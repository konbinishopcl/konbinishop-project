import type { MetadataRoute } from "next";
import { api } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://konbini.cl";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Rutas estáticas
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/busqueda`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
  ];

  // Categorías
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await api.categories();
    categoryRoutes = categories.map((c) => ({
      url: `${SITE_URL}/categoria/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {
    // API no disponible — se omiten las categorías del sitemap.
  }

  // Eventos aprobados
  let eventRoutes: MetadataRoute.Sitemap = [];
  try {
    const list = await api.events({ pageSize: 500 });
    eventRoutes = list.items.map((e) => ({
      url: `${SITE_URL}/evento/${e.slug}`,
      lastModified: new Date(e.expirationDate ?? now),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
  } catch {
    // API no disponible — se omiten los eventos del sitemap.
  }

  return [...staticRoutes, ...categoryRoutes, ...eventRoutes];
}
