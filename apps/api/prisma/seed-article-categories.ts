/**
 * Seed de categorías de artículos — Konbini.
 * Idempotente: usa upsert por slug. No borra nada.
 * Ejecutar: npx ts-node prisma/seed-article-categories.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ARTICLE_CATEGORIES = [
  { name: 'Anuncios',                         slug: 'anuncios' },
  { name: 'Cultura Otaku',                    slug: 'cultura-otaku' },
  { name: 'Coleccionables',                   slug: 'coleccionables' },
  { name: 'Colaboraciones',                   slug: 'colaboraciones' },
  { name: 'Manga',                            slug: 'manga' },
  { name: 'Anime',                            slug: 'anime' },
  { name: 'Live Action',                      slug: 'live-action' },
  { name: 'Cómics',                           slug: 'comics' },
  { name: 'Juegos',                           slug: 'juegos' },
  { name: 'Cine',                             slug: 'cine' },
  { name: 'Series',                           slug: 'series' },
  { name: 'TV',                               slug: 'tv' },
  { name: 'Streaming',                        slug: 'streaming' },
  { name: 'Netflix',                          slug: 'netflix' },
  { name: 'Crunchyroll',                      slug: 'crunchyroll' },
  { name: 'Max',                              slug: 'max' },
  { name: 'Disney',                           slug: 'disney' },
  { name: 'Amazon Prime',                     slug: 'amazon-prime' },
  { name: 'Entretenimiento',                  slug: 'entretenimiento' },
  { name: 'Eventos',                          slug: 'eventos' },
  { name: 'Conciertos',                       slug: 'conciertos' },
  { name: 'Parques Temáticos',                slug: 'parques-tematicos' },
  { name: 'Naruto',                           slug: 'naruto' },
  { name: 'Dragon Ball',                      slug: 'dragon-ball' },
  { name: 'One Piece',                        slug: 'one-piece' },
  { name: 'Attack on Titan',                  slug: 'attack-on-titan' },
  { name: 'Demon Slayer',                     slug: 'demon-slayer' },
  { name: 'My Hero Academia',                 slug: 'my-hero-academia' },
  { name: 'Death Note',                       slug: 'death-note' },
  { name: 'Fullmetal Alchemist Brotherhood',  slug: 'fullmetal-alchemist-brotherhood' },
  { name: 'Hunter x Hunter',                  slug: 'hunter-x-hunter' },
  { name: 'Jujutsu Kaisen',                   slug: 'jujutsu-kaisen' },
  { name: 'Música',                           slug: 'musica' },
  { name: 'Aniversarios',                     slug: 'aniversarios' },
  { name: 'Stage Play',                       slug: 'stage-play' },
  { name: 'Bleach',                           slug: 'bleach' },
  { name: 'Dandadan',                         slug: 'dandadan' },
  { name: 'Konnichiwa Festival',              slug: 'konnichiwa-festival' },
  { name: 'Haikyuu',                          slug: 'haikyuu' },
];

async function main() {
  console.log(`Seeding ${ARTICLE_CATEGORIES.length} article categories...`);

  let created = 0;
  let skipped = 0;

  for (const cat of ARTICLE_CATEGORIES) {
    const result = await prisma.articleCategory.upsert({
      where:  { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug },
    });
    const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
    if (isNew) { created++; console.log(`  ✓ ${cat.name}`); }
    else        { skipped++; }
  }

  console.log(`\nDone — ${created} created, ${skipped} already existed.`);
  const total = await prisma.articleCategory.count();
  console.log(`Total article_categories in DB: ${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
