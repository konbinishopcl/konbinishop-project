/**
 * Import articles from konbinishop.com WordPress REST API.
 * - Fetches all published posts with pagination
 * - Converts HTML → Markdown
 * - Extracts YouTube URLs from iframes
 * - Extracts #hashtags → articleTags (removes # prefix)
 * - Maps WP categories → article_categories by slug
 * - Upserts via Prisma (idempotent by slug)
 *
 * Run: npx ts-node prisma/import-wp-articles.ts
 */
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();
const WP_API   = 'https://konbinishop.com/wp-json/wp/v2';
const PER_PAGE = 100;
const DELAY_MS = 400;

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ── HTML → Markdown ────────────────────────────────────────────────────────

function decodeEntities(str: string): string {
  const map: Record<string, string> = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'",
    '&nbsp;': ' ', '&hellip;': '…', '&laquo;': '«', '&raquo;': '»',
    '&ndash;': '–', '&mdash;': '—', '&ldquo;': '"', '&rdquo;': '"',
    '&lsquo;': "'", '&rsquo;': "'", '&#8211;': '–', '&#8212;': '—',
    '&#8216;': "'", '&#8217;': "'", '&#8220;': '"', '&#8221;': '"',
    '&#8230;': '…',
  };
  let s = str;
  for (const [e, c] of Object.entries(map)) s = s.replaceAll(e, c);
  return s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

function htmlToMarkdown(html: string): string {
  let md = html;

  // Remove scripts, styles, comments
  md = md.replace(/<!--[\s\S]*?-->/g, '');
  md = md.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  md = md.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove WP embed blocks (YouTube etc — handled separately)
  md = md.replace(/<figure[^>]*class="[^"]*wp-block-embed[^"]*"[^>]*>[\s\S]*?<\/figure>/gi, '');
  md = md.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');

  // WP image figures
  md = md.replace(
    /<figure[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>[\s\S]*?<\/figure>/gi,
    '\n![$2]($1)\n',
  );
  md = md.replace(
    /<figure[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*\/?>[\s\S]*?<\/figure>/gi,
    '\n![]($1)\n',
  );

  // Headers
  for (let i = 6; i >= 1; i--) {
    const h = '#'.repeat(i);
    md = md.replace(new RegExp(`<h${i}[^>]*>([\\s\\S]*?)<\\/h${i}>`, 'gi'), `\n${h} $1\n`);
  }

  // Inline formatting
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');

  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Standalone images
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

  // Blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) =>
    inner.replace(/<[^>]+>/g, '').trim().split('\n')
      .map((l: string) => `> ${l.trim()}`).join('\n'),
  );

  // Lists
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1');
  md = md.replace(/<\/?[uo]l[^>]*>/gi, '\n');

  // Paragraphs + line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');
  md = md.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '\n$1\n');

  // Strip remaining tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  md = decodeEntities(md);

  // Clean excessive whitespace
  md = md.replace(/[ \t]+/g, ' ');
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}

// ── YouTube extraction ─────────────────────────────────────────────────────

function extractYouTube(html: string): string | null {
  // iframe embed
  const embedMatch = html.match(/src="(https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([\w-]+)[^"]*)"/i);
  if (embedMatch) return `https://www.youtube.com/watch?v=${embedMatch[2]}`;
  // watch URL
  const watchMatch = html.match(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]+)/i);
  if (watchMatch) return `https://www.youtube.com/watch?v=${watchMatch[1]}`;
  // youtu.be short URL
  const shortMatch = html.match(/https?:\/\/youtu\.be\/([\w-]+)/i);
  if (shortMatch) return `https://www.youtube.com/watch?v=${shortMatch[1]}`;
  return null;
}

// ── Hashtag extraction ─────────────────────────────────────────────────────

function extractHashtags(text: string): string[] {
  const matches = text.match(/#([a-zA-ZÀ-ÿ0-9_áéíóúÁÉÍÓÚñÑüÜ]+)/g) ?? [];
  return [...new Set(matches.map(m => m.slice(1)))].filter(t => t.length >= 2);
}

function slugifyTag(name: string): string {
  return slugify(name, { lower: true, strict: true, locale: 'es' });
}

function cleanWpSlug(wpSlug: string): string {
  try {
    return slugify(decodeURIComponent(wpSlug), { lower: true, strict: true, locale: 'es' });
  } catch {
    return slugify(wpSlug, { lower: true, strict: true, locale: 'es' });
  }
}

// ── WP API helpers ─────────────────────────────────────────────────────────

async function fetchAllWpPosts() {
  const posts: any[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url =
      `${WP_API}/posts?per_page=${PER_PAGE}&page=${page}&status=publish` +
      `&_fields=id,slug,title,content,excerpt,date,categories,featured_media`;
    const res = await fetch(url);
    if (!res.ok) { console.error(`  WP API page ${page} error: ${res.status}`); break; }
    if (page === 1) {
      totalPages = parseInt(res.headers.get('X-WP-TotalPages') ?? '1');
      const total = res.headers.get('X-WP-Total');
      console.log(`  Total WP posts: ${total} across ${totalPages} pages`);
    }
    const batch: any[] = await res.json();
    posts.push(...batch);
    console.log(`  Page ${page}/${totalPages} — ${batch.length} posts fetched`);
    page++;
    if (page <= totalPages) await sleep(DELAY_MS);
  }
  return posts;
}

/** Fetch source_url for a batch of media IDs. Returns map mediaId → url. */
async function fetchMediaUrls(mediaIds: number[]): Promise<Record<number, string>> {
  const map: Record<number, string> = {};
  const unique = [...new Set(mediaIds.filter(id => id > 0))];
  const BATCH = 100;

  for (let i = 0; i < unique.length; i += BATCH) {
    const chunk = unique.slice(i, i + BATCH);
    const url = `${WP_API}/media?include=${chunk.join(',')}&per_page=${BATCH}&_fields=id,source_url`;
    const res = await fetch(url);
    if (!res.ok) { console.error(`  Media fetch error: ${res.status}`); continue; }
    const items: any[] = await res.json();
    for (const m of items) {
      if (m.source_url) map[m.id] = m.source_url;
    }
    console.log(`  Media batch ${Math.floor(i / BATCH) + 1}: ${items.length} URLs fetched`);
    await sleep(DELAY_MS);
  }
  return map;
}

async function fetchWpCategories(): Promise<{ id: number; slug: string }[]> {
  const res = await fetch(`${WP_API}/categories?per_page=100&_fields=id,slug`);
  return res.ok ? res.json() : [];
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // 1. Load our article_categories by slug → id
  const dbCats  = await prisma.articleCategory.findMany();
  const catMap: Record<string, number> = {};
  for (const c of dbCats) catMap[c.slug] = c.id;
  console.log(`Loaded ${dbCats.length} article categories from DB`);

  // 2. Fetch WP categories → map WP id to our category id
  const wpCats = await fetchWpCategories();
  const wpCatToOurId: Record<number, number | null> = {};
  for (const wc of wpCats) wpCatToOurId[wc.id] = catMap[wc.slug] ?? null;
  console.log(`Mapped ${wpCats.length} WP categories\n`);

  // 3. Fetch all WP posts
  console.log('Fetching WordPress posts...');
  const posts = await fetchAllWpPosts();

  // 4. Batch-fetch all featured media URLs
  const mediaIds = posts.map((p: any) => p.featured_media ?? 0).filter((id: number) => id > 0);
  console.log(`\nFetching media URLs for ${mediaIds.length} posts...`);
  const mediaUrlMap = await fetchMediaUrls(mediaIds);
  console.log(`  Resolved ${Object.keys(mediaUrlMap).length} media URLs\n`);

  console.log(`Importing ${posts.length} posts...\n`);

  let created = 0, updated = 0, failed = 0;

  for (const post of posts) {
    try {
      const html = (post.content?.rendered ?? '') as string;

      // YouTube
      const youtubeUrl = extractYouTube(html);

      // Hashtags (extract before stripping from content)
      const hashtags = extractHashtags(html);

      // Clean HTML: remove hashtag-only text nodes, then convert
      const cleanHtml = html.replace(/(^|\s)#[a-zA-ZÀ-ÿ0-9_]+/g, '');
      const content   = htmlToMarkdown(cleanHtml);

      if (!content || content.length < 5) { failed++; continue; }

      // Featured image from media URL map (fetched separately — _embed unreliable on this WP)
      const image: string | null = mediaUrlMap[post.featured_media] ?? null;

      // Article category (first WP category that maps to ours)
      let articleCategoryId: number | null = null;
      for (const wpId of (post.categories ?? [])) {
        const ourId = wpCatToOurId[wpId];
        if (ourId) { articleCategoryId = ourId; break; }
      }

      // Title and excerpt (strip HTML tags)
      const title   = decodeEntities((post.title?.rendered ?? post.slug).replace(/<[^>]+>/g, ''));
      const rawEx   = (post.excerpt?.rendered ?? '').replace(/<[^>]+>/g, '');
      const excerpt = decodeEntities(rawEx).replace(/\[…\]/g, '…').trim().slice(0, 190) || null;

      // Upsert articleTags
      const tagIds: number[] = [];
      for (const name of hashtags) {
        const slug = slugifyTag(name);
        if (!slug) continue;
        try {
          const tag = await prisma.articleTag.upsert({
            where:  { slug },
            update: { name },
            create: { name, slug },
          });
          tagIds.push(tag.id);
        } catch { /* skip duplicate */ }
      }

      // Upsert article
      const articleSlug = cleanWpSlug(post.slug);
      const existing = await prisma.article.findUnique({ where: { slug: articleSlug } });
      const postDate = new Date(post.date);

      if (existing) {
        await prisma.article.update({
          where: { slug: articleSlug },
          data: {
            title,
            content,
            excerpt,
            image,
            youtubeUrl,
            articleCategoryId,
            status: 'APPROVED',
            updatedAt: postDate,
            ...(tagIds.length && { articleTags: { set: tagIds.map(id => ({ id })) } }),
          },
        });
        updated++;
      } else {
        await prisma.article.create({
          data: {
            title,
            slug: articleSlug,
            content,
            excerpt,
            image,
            youtubeUrl,
            articleCategoryId,
            status: 'APPROVED',
            createdAt: postDate,
            updatedAt: postDate,
            ...(tagIds.length && { articleTags: { connect: tagIds.map(id => ({ id })) } }),
          },
        });
        created++;
      }

      process.stdout.write(existing ? 'u' : '+');
    } catch (e: any) {
      process.stdout.write('!');
      console.error(`\n  Error on "${cleanWpSlug(post.slug)}": ${e.message}`);
      failed++;
    }
  }

  console.log('\n');
  console.log(`✓ Created : ${created}`);
  console.log(`✓ Updated : ${updated}`);
  console.log(`✗ Failed  : ${failed}`);
  const total = await prisma.article.count();
  console.log(`Total articles in DB: ${total}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
