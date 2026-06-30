/**
 * Bloqueo de indexación por entorno.
 *
 * BLOCK_INDEXING="true"  → el sitio NO se indexa: robots.txt con `disallow: /`
 *                          y meta `noindex, nofollow` en todas las páginas.
 * "false" / ausente      → indexación normal (SEO activo).
 *
 * Variable server-side (no NEXT_PUBLIC): solo se usa en robots.ts y en la
 * metadata del layout, ambos en el servidor. Cambiarla en Vercel redepliega.
 */
export const BLOCK_INDEXING = process.env.BLOCK_INDEXING === "true";
