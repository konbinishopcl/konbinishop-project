/**
 * Re-categoriza artículos importados desde WP.
 * Problema: la categoría catch-all "cultura-otaku" (WP id 57) aparece SIEMPRE primera
 * en las categorías de cada post, así que todos los artículos quedaron con Cultura Otaku.
 *
 * Lógica corregida:
 *   1. Para cada post, obtener TODOS sus WP category IDs
 *   2. Mapear a nuestros IDs de DB
 *   3. Filtrar "cultura-otaku" si hay otras opciones más específicas
 *   4. De las restantes, elegir la de MENOR count en WP (más específica)
 *   5. Si solo hay cultura-otaku → usarla (es mejor que null)
 *
 * Run: npx ts-node prisma/recategorize-articles.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const WP_API = 'https://konbinishop.com/wp-json/wp/v2';
const PER_PAGE = 100;
const DELAY_MS = 300;

// Slugs catch-all que se saltan cuando hay alternativas
const CATCHALL_SLUGS = new Set(['cultura-otaku', 'uncategorized']);

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWpCategories(): Promise<{ id: number; slug: string; count: number }[]> {
  const res = await fetch(`${WP_API}/categories?per_page=100&_fields=id,slug,count`);
  return res.ok ? res.json() : [];
}

async function fetchAllWpPosts() {
  const posts: any[] = [];
  let page = 1, totalPages = 1;
  while (page <= totalPages) {
    const url = `${WP_API}/posts?per_page=${PER_PAGE}&page=${page}&status=publish&_fields=id,slug,categories`;
    const res = await fetch(url);
    if (!res.ok) { console.error(`  WP API page ${page}: ${res.status}`); break; }
    if (page === 1) {
      totalPages = parseInt(res.headers.get('X-WP-TotalPages') ?? '1');
      console.log(`  ${res.headers.get('X-WP-Total')} posts, ${totalPages} pages`);
    }
    posts.push(...await res.json() as any[]);
    console.log(`  Page ${page}/${totalPages}`);
    page++;
    if (page <= totalPages) await sleep(DELAY_MS);
  }
  return posts;
}

async function main() {
  // 1. Load DB categories (slug → id)
  const dbCats = await prisma.articleCategory.findMany({ select: { id: true, slug: true } });
  const catMap: Record<string, number> = {};
  for (const c of dbCats) catMap[c.slug] = c.id;
  console.log(`Loaded ${dbCats.length} DB categories`);

  // 2. Fetch WP categories with counts
  const wpCats = await fetchWpCategories();
  // Map: WP id → { ourId, slug, count }
  const wpInfo: Record<number, { ourId: number | null; slug: string; count: number }> = {};
  for (const wc of wpCats) {
    wpInfo[wc.id] = { ourId: catMap[wc.slug] ?? null, slug: wc.slug, count: wc.count };
  }
  console.log(`Fetched ${wpCats.length} WP categories\n`);

  // 3. Fetch all WP posts (slug + categories only)
  console.log('Fetching WP posts...');
  const posts = await fetchAllWpPosts();
  console.log(`\nRe-categorizing ${posts.length} posts...\n`);

  let updated = 0, unchanged = 0, nocat = 0;

  for (const post of posts) {
    const wpIds: number[] = post.categories ?? [];

    // Build list of mappable candidates with metadata
    const candidates = wpIds
      .map(id => wpInfo[id])
      .filter(Boolean)
      .filter(c => c.ourId !== null) as { ourId: number; slug: string; count: number }[];

    let chosenId: number | null = null;

    if (candidates.length === 0) {
      nocat++;
    } else {
      // Remove catch-alls if there are specific alternatives
      const specific = candidates.filter(c => !CATCHALL_SLUGS.has(c.slug));
      const pool = specific.length > 0 ? specific : candidates;
      // Pick the most specific (lowest WP count)
      pool.sort((a, b) => a.count - b.count);
      chosenId = pool[0].ourId;
    }

    // Update only if different from current value
    const article = await prisma.article.findUnique({
      where: { slug: post.slug },
      select: { id: true, articleCategoryId: true },
    });
    if (!article) continue;

    if (article.articleCategoryId !== chosenId) {
      await prisma.article.update({
        where: { id: article.id },
        data: { articleCategoryId: chosenId },
      });
      updated++;
      process.stdout.write('u');
    } else {
      unchanged++;
      process.stdout.write('.');
    }
  }

  console.log('\n');
  console.log(`✓ Updated   : ${updated}`);
  console.log(`· Unchanged : ${unchanged}`);
  console.log(`✗ No cat    : ${nocat}`);

  // Show distribution after
  const groups = await prisma.article.groupBy({
    by: ['articleCategoryId'],
    _count: { articleCategoryId: true },
    orderBy: { _count: { articleCategoryId: 'desc' } },
  });
  console.log('\nNew distribution (top 15):');
  for (const g of groups.slice(0, 15)) {
    const name = dbCats.find(c => c.id === g.articleCategoryId)?.slug ?? '(null)';
    console.log(`  ${name}: ${g._count.articleCategoryId}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
