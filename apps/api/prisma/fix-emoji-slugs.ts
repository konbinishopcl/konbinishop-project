import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

function cleanSlug(text: string): string {
  return slugify(text, { lower: true, strict: true, locale: 'es' });
}

const hasNonAscii = (s: string) => /[^\x00-\x7F]/.test(s) || s.includes('%');

async function main() {
  // Articles
  const articles = await prisma.article.findMany({ select: { id: true, slug: true, title: true } });
  const badArticles = articles.filter((a) => hasNonAscii(a.slug));
  console.log(`Articles con slug sucio: ${badArticles.length}`);

  for (const a of badArticles) {
    let base = cleanSlug(a.title);
    if (!base) base = `articulo-${a.id}`;
    let candidate = base;
    let n = 0;
    while (true) {
      const conflict = await prisma.article.findFirst({ where: { slug: candidate, NOT: { id: a.id } } });
      if (!conflict) break;
      candidate = `${base}-${++n}`;
    }
    await prisma.article.update({ where: { id: a.id }, data: { slug: candidate } });
    console.log(`  [article ${a.id}] ${a.slug} → ${candidate}`);
  }

  // Events
  const events = await prisma.event.findMany({ select: { id: true, slug: true, title: true } });
  const badEvents = events.filter((e) => hasNonAscii(e.slug));
  console.log(`Events con slug sucio: ${badEvents.length}`);

  for (const e of badEvents) {
    let base = cleanSlug(e.title);
    if (!base) base = `evento-${e.id}`;
    let candidate = base;
    let n = 0;
    while (true) {
      const conflict = await prisma.event.findFirst({ where: { slug: candidate, NOT: { id: e.id } } });
      if (!conflict) break;
      candidate = `${base}-${++n}`;
    }
    await prisma.event.update({ where: { id: e.id }, data: { slug: candidate } });
    console.log(`  [event ${e.id}] ${e.slug} → ${candidate}`);
  }

  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
