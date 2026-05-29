/**
 * update-article-categories.ts
 *
 * Idempotent JSON-only script. NO DB connection.
 * Reads prisma/data/articles.json, fetches WP categories + posts,
 * and updates each article's categories from categorySlug (singular)
 * to categorySlugs (array). Safe to re-run.
 *
 * Run: cd apps/api && pnpm exec ts-node prisma/update-article-categories.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import slugify from 'slugify';

const WP_API  = 'https://konbinishop.com/wp-json/wp/v2';
const OUT_FILE = join(process.cwd(), 'prisma', 'data', 'articles.json');

// D-02: catch-all categories that are generic — prefer specific ones when available
const CATCHALL = new Set(['cultura-otaku', 'anime', 'uncategorized']);

// Copied EXACTLY from export-wp-articles.ts (lines 170-176)
function cleanWpSlug(wpSlug: string): string {
  try {
    return slugify(decodeURIComponent(wpSlug), { lower: true, strict: true, locale: 'es' });
  } catch {
    return slugify(wpSlug, { lower: true, strict: true, locale: 'es' });
  }
}

async function fetchWpCategories(): Promise<Record<number, string>> {
  const res = await fetch(`${WP_API}/categories?per_page=100&_fields=id,slug`);
  if (!res.ok) throw new Error(`WP categories HTTP ${res.status}`);
  const cats: Array<{ id: number; slug: string }> = await res.json();
  const map: Record<number, string> = {};
  for (const c of cats) map[c.id] = c.slug;
  return map;
}

async function fetchAllWpPosts(): Promise<Array<{ slug: string; categories: number[] }>> {
  const posts: Array<{ slug: string; categories: number[] }> = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const url = `${WP_API}/posts?per_page=100&page=${page}&status=publish&_fields=id,slug,categories`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`WP posts page ${page} HTTP ${res.status}`);
    if (page === 1) {
      totalPages = parseInt(res.headers.get('X-WP-TotalPages') ?? '1', 10);
      console.log(`  Total WP pages: ${totalPages}`);
    }
    const batch: Array<{ slug: string; categories: number[] }> = await res.json();
    posts.push(...batch);
    console.log(`  Page ${page}/${totalPages} — ${batch.length} posts fetched`);
    page++;
  }
  return posts;
}

async function main() {
  // Load existing articles.json
  const articles: any[] = JSON.parse(readFileSync(OUT_FILE, 'utf-8'));
  console.log(`Loaded ${articles.length} articles from articles.json`);

  // Build a Map by normalized slug for fast lookup (PITFALL 2: slugs in JSON are already normalized)
  const articleBySlug = new Map<string, any>();
  for (const art of articles) {
    articleBySlug.set(art.slug, art);
  }

  let wpEnriched = 0;

  try {
    console.log('\nFetching WP categories...');
    const wpCatSlug = await fetchWpCategories();
    console.log(`  ${Object.keys(wpCatSlug).length} WP categories loaded`);

    console.log('\nFetching WP posts (ids, slugs, categories only)...');
    const posts = await fetchAllWpPosts();
    console.log(`  ${posts.length} WP posts fetched\n`);

    for (const post of posts) {
      // PITFALL 2: normalize the raw WP slug before cross-referencing
      const normalizedSlug = cleanWpSlug(post.slug);
      const art = articleBySlug.get(normalizedSlug);
      if (!art) continue; // post not in our JSON — skip

      // Derive category slugs from WP category IDs
      const catSlugs = (post.categories ?? [])
        .map((id: number) => wpCatSlug[id])
        .filter(Boolean) as string[];

      // Catch-all logic (D-02): prefer specific categories over generic ones
      const specific = catSlugs.filter(s => !CATCHALL.has(s));
      const categorySlugs = specific.length > 0 ? specific : catSlugs;

      art.categorySlugs = categorySlugs;
      wpEnriched++;
    }

    console.log(`WP enrichment complete: ${wpEnriched}/${articles.length} articles matched`);
  } catch (err: any) {
    console.warn(`\nWARNING: WP API no disponible — ${err.message}`);
    console.warn('articles.json se actualizará usando datos locales (sin enriquecimiento multi-categoría).');
    console.warn('Re-ejecutar este script cuando konbinishop.com esté disponible para obtener categorySlugs reales.');
  }

  // Final sweep: ensure ALL articles have categorySlugs[] and NO categorySlug (singular)
  // This handles: articles not matched by WP, and the offline fallback case.
  let fallbackCount = 0;
  for (const art of articles) {
    if (!('categorySlugs' in art)) {
      // Not enriched by WP — use existing categorySlug as single-element array, or empty
      art.categorySlugs = art.categorySlug ? [art.categorySlug] : [];
      fallbackCount++;
    }
    delete art.categorySlug; // remove singular key unconditionally
  }

  if (fallbackCount > 0) {
    console.log(`Fallback applied to ${fallbackCount} unmatched articles (using existing categorySlug data)`);
  }

  // Sanity check: warn if too many empty-array articles (indicates slug mismatch)
  const emptyCount = articles.filter(a => a.categorySlugs.length === 0).length;
  if (emptyCount > 20) {
    console.warn(`WARNING: ${emptyCount} articles have categorySlugs: [] — possible slug normalization mismatch`);
  } else {
    console.log(`Articles with no category: ${emptyCount}`);
  }

  writeFileSync(OUT_FILE, JSON.stringify(articles, null, 2), 'utf-8');
  console.log(`\nDone. ${articles.length} articles written to ${OUT_FILE}`);
  console.log(`  WP-enriched: ${wpEnriched}, fallback: ${fallbackCount}`);
}

main().catch(err => {
  console.error(err);
  process.exit(0); // exit 0 — do not overwrite JSON on error
});
