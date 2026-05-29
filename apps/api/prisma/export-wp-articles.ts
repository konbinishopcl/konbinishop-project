/**
 * Export WordPress articles to prisma/data/articles.json
 *
 * - Fetches all published posts from konbinishop.com WP REST API
 * - Downloads featured image + inline body images to apps/api/uploads/
 * - Strips inline images from content body; stores them as gallery array
 * - Maps WP categories → article_categories slugs
 * - Extracts #hashtags → tags
 * - Extracts YouTube URLs from iframes
 *
 * Run: npx ts-node prisma/export-wp-articles.ts
 * Output: prisma/data/articles.json
 */
import { createWriteStream, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { randomBytes } from 'crypto';
import { pipeline } from 'stream/promises';
import * as https from 'https';
import * as http from 'http';
import slugify from 'slugify';
import { writeFileSync } from 'fs';

const WP_API    = 'https://konbinishop.com/wp-json/wp/v2';
const PER_PAGE  = 100;
const DELAY_MS  = 400;
const UPLOADS_DIR = join(process.cwd(), 'uploads');
const OUT_FILE    = join(process.cwd(), 'prisma', 'data', 'articles.json');

mkdirSync(UPLOADS_DIR, { recursive: true });

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Download helper ────────────────────────────────────────────────────────

function fetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { timeout: 15000 }, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      const chunks: Buffer[] = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject).on('timeout', () => reject(new Error(`Timeout: ${url}`)));
  });
}

function mimeFromUrl(url: string): string {
  const ext = extname(url.split('?')[0]).toLowerCase();
  return ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' } as Record<string, string>)[ext] ?? 'image/jpeg';
}

function extForMime(mime: string): string {
  return ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string, string>)[mime] ?? 'jpg';
}

async function downloadImage(url: string): Promise<string | null> {
  try {
    const buf  = await fetchBuffer(url);
    const mime = mimeFromUrl(url);
    const ext  = extForMime(mime);
    const filename = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`;
    const dest = join(UPLOADS_DIR, filename);
    const { writeFileSync } = await import('fs');
    writeFileSync(dest, buf);
    return `/uploads/${filename}`;
  } catch (e: any) {
    console.error(`    ↳ download failed: ${url} — ${e.message}`);
    return null;
  }
}

// ── HTML → Markdown (same logic as importer) ──────────────────────────────

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

function extractInlineImageUrls(html: string): string[] {
  const urls: string[] = [];
  // WP embed figures
  const embedFigures = html.matchAll(/<figure[^>]*class="[^"]*wp-block-embed[^"]*"[^>]*>[\s\S]*?<\/figure>/gi);
  // img tags
  const imgTags = html.matchAll(/<img[^>]*src="([^"]+)"[^>]*\/?>/gi);
  for (const m of imgTags) {
    const url = m[1];
    if (url && !url.startsWith('data:')) urls.push(url);
  }
  return [...new Set(urls)];
}

function htmlToMarkdownStripped(html: string): string {
  let md = html;

  md = md.replace(/<!--[\s\S]*?-->/g, '');
  md = md.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  md = md.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // Remove all embeds and iframes
  md = md.replace(/<figure[^>]*class="[^"]*wp-block-embed[^"]*"[^>]*>[\s\S]*?<\/figure>/gi, '');
  md = md.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  // Remove all image figures entirely (moved to gallery)
  md = md.replace(/<figure[^>]*>[\s\S]*?<img[^>]*>[\s\S]*?<\/figure>/gi, '');
  // Remove standalone img tags
  md = md.replace(/<img[^>]*\/?>/gi, '');

  for (let i = 6; i >= 1; i--) {
    const h = '#'.repeat(i);
    md = md.replace(new RegExp(`<h${i}[^>]*>([\\s\\S]*?)<\\/h${i}>`, 'gi'), `\n${h} $1\n`);
  }

  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) =>
    inner.replace(/<[^>]+>/g, '').trim().split('\n')
      .map((l: string) => `> ${l.trim()}`).join('\n'),
  );

  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1');
  md = md.replace(/<\/?[uo]l[^>]*>/gi, '\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');
  md = md.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '\n$1\n');
  md = md.replace(/<[^>]+>/g, '');

  md = decodeEntities(md);
  md = md.replace(/[ \t]+/g, ' ');
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}

function extractYouTube(html: string): string | null {
  const embedMatch = html.match(/src="(https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([\w-]+)[^"]*)"/i);
  if (embedMatch) return `https://www.youtube.com/watch?v=${embedMatch[2]}`;
  const watchMatch = html.match(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]+)/i);
  if (watchMatch) return `https://www.youtube.com/watch?v=${watchMatch[1]}`;
  const shortMatch = html.match(/https?:\/\/youtu\.be\/([\w-]+)/i);
  if (shortMatch) return `https://www.youtube.com/watch?v=${shortMatch[1]}`;
  return null;
}

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
  let page = 1, totalPages = 1;
  while (page <= totalPages) {
    const url = `${WP_API}/posts?per_page=${PER_PAGE}&page=${page}&status=publish&_fields=id,slug,title,content,excerpt,date,categories,featured_media`;
    const res = await fetch(url);
    if (!res.ok) { console.error(`  WP page ${page} error: ${res.status}`); break; }
    if (page === 1) {
      totalPages = parseInt(res.headers.get('X-WP-TotalPages') ?? '1');
      console.log(`  Total posts: ${res.headers.get('X-WP-Total')} across ${totalPages} pages`);
    }
    const batch: any[] = await res.json();
    posts.push(...batch);
    console.log(`  Page ${page}/${totalPages} — ${batch.length} posts`);
    page++;
    if (page <= totalPages) await sleep(DELAY_MS);
  }
  return posts;
}

async function fetchMediaUrls(mediaIds: number[]): Promise<Record<number, string>> {
  const map: Record<number, string> = {};
  const unique = [...new Set(mediaIds.filter(id => id > 0))];
  const BATCH = 100;
  for (let i = 0; i < unique.length; i += BATCH) {
    const chunk = unique.slice(i, i + BATCH);
    const url = `${WP_API}/media?include=${chunk.join(',')}&per_page=${BATCH}&_fields=id,source_url`;
    const res = await fetch(url);
    if (!res.ok) { console.error(`  Media batch error: ${res.status}`); continue; }
    const items: any[] = await res.json();
    for (const m of items) if (m.source_url) map[m.id] = m.source_url;
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
  console.log('Fetching WP categories...');
  const wpCats = await fetchWpCategories();
  const wpCatSlug: Record<number, string> = {};
  for (const c of wpCats) wpCatSlug[c.id] = c.slug;
  console.log(`  ${wpCats.length} categories`);

  console.log('\nFetching WP posts...');
  const posts = await fetchAllWpPosts();

  const mediaIds = posts.map((p: any) => p.featured_media ?? 0);
  console.log(`\nFetching ${mediaIds.filter((id: number) => id > 0).length} featured media URLs...`);
  const mediaUrlMap = await fetchMediaUrls(mediaIds);

  console.log(`\nProcessing ${posts.length} posts...\n`);

  const results: any[] = [];
  let i = 0;

  for (const post of posts) {
    i++;
    process.stdout.write(`[${i}/${posts.length}] ${post.slug}\n`);

    const html = (post.content?.rendered ?? '') as string;
    const youtubeUrl = extractYouTube(html);
    const hashtags   = extractHashtags(html);
    const cleanHtml  = html.replace(/(^|\s)#[a-zA-ZÀ-ÿ0-9_]+/g, '');

    // Extract inline image URLs before stripping
    const inlineUrls = extractInlineImageUrls(cleanHtml);

    // Convert HTML to markdown without images
    const content = htmlToMarkdownStripped(cleanHtml);
    if (!content || content.length < 5) {
      console.log(`  skipped (empty content)`);
      continue;
    }

    // Featured image
    const featuredUrl: string | null = mediaUrlMap[post.featured_media] ?? null;
    let image: string | null = null;
    if (featuredUrl) {
      process.stdout.write(`  ↓ featured image\n`);
      image = await downloadImage(featuredUrl);
      await sleep(100);
    }

    // Gallery: download inline images
    const gallery: string[] = [];
    for (const imgUrl of inlineUrls) {
      // Skip if same as featured
      if (featuredUrl && imgUrl === featuredUrl) continue;
      process.stdout.write(`  ↓ gallery image\n`);
      const localUrl = await downloadImage(imgUrl);
      if (localUrl) gallery.push(localUrl);
      await sleep(100);
    }

    // Category slug (pick most specific, skip catch-alls if alternatives exist)
    const CATCHALL = new Set(['cultura-otaku', 'anime', 'uncategorized']);
    const catSlugs = (post.categories ?? []).map((id: number) => wpCatSlug[id]).filter(Boolean) as string[];
    const specific = catSlugs.filter(s => !CATCHALL.has(s));
    const categorySlugs = specific.length > 0 ? specific : catSlugs;

    // Tags
    const tags = hashtags.map(name => ({
      name,
      slug: slugifyTag(name),
    })).filter(t => t.slug.length >= 2);

    const title   = decodeEntities((post.title?.rendered ?? post.slug).replace(/<[^>]+>/g, ''));
    const rawEx   = (post.excerpt?.rendered ?? '').replace(/<[^>]+>/g, '');
    const excerpt = decodeEntities(rawEx).replace(/\[…\]/g, '…').trim().slice(0, 190) || null;

    results.push({
      title,
      slug:         cleanWpSlug(post.slug),
      excerpt,
      content,
      image,
      youtubeUrl,
      categorySlugs,
      tags,
      gallery,
      createdAt: new Date(post.date).toISOString(),
      updatedAt: new Date(post.date).toISOString(),
    });
  }

  writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n✓ Exported ${results.length} articles → ${OUT_FILE}`);
  console.log(`  Featured images downloaded: ${results.filter(r => r.image).length}`);
  console.log(`  Gallery images total: ${results.reduce((s, r) => s + r.gallery.length, 0)}`);
}

main().catch(e => { console.error(e); process.exit(1); });
