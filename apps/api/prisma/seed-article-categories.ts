/**
 * Seed de categorías de artículos — Konbini.
 * Idempotente: usa upsert por slug. No borra nada.
 * Ejecutar: npx ts-node prisma/seed-article-categories.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ARTICLE_CATEGORIES = [
  { name: 'Anuncios',                         nameJa: 'お知らせ',              slug: 'anuncios' },
  { name: 'Cultura Otaku',                    nameJa: 'オタク文化',            slug: 'cultura-otaku' },
  { name: 'Coleccionables',                   nameJa: 'グッズ',               slug: 'coleccionables' },
  { name: 'Colaboraciones',                   nameJa: 'コラボ',               slug: 'colaboraciones' },
  { name: 'Manga',                            nameJa: 'マンガ',               slug: 'manga' },
  { name: 'Anime',                            nameJa: 'アニメ',               slug: 'anime' },
  { name: 'Live Action',                      nameJa: '実写',                 slug: 'live-action' },
  { name: 'Cómics',                           nameJa: 'コミック',             slug: 'comics' },
  { name: 'Juegos',                           nameJa: 'ゲーム',               slug: 'juegos' },
  { name: 'Cine',                             nameJa: '映画',                 slug: 'cine' },
  { name: 'Series',                           nameJa: 'ドラマ',               slug: 'series' },
  { name: 'TV',                               nameJa: 'テレビ',               slug: 'tv' },
  { name: 'Streaming',                        nameJa: '配信',                 slug: 'streaming' },
  { name: 'Netflix',                          nameJa: 'Netflix',              slug: 'netflix' },
  { name: 'Crunchyroll',                      nameJa: 'クランチロール',        slug: 'crunchyroll' },
  { name: 'Max',                              nameJa: 'Max',                  slug: 'max' },
  { name: 'Disney',                           nameJa: 'Disney+',              slug: 'disney' },
  { name: 'Amazon Prime',                     nameJa: 'Prime',                slug: 'amazon-prime' },
  { name: 'Entretenimiento',                  nameJa: 'エンタメ',             slug: 'entretenimiento' },
  { name: 'Eventos',                          nameJa: 'イベント',             slug: 'eventos' },
  { name: 'Conciertos',                       nameJa: 'コンサート',           slug: 'conciertos' },
  { name: 'Parques Temáticos',                nameJa: 'テーマパーク',          slug: 'parques-tematicos' },
  { name: 'Naruto',                           nameJa: 'ナルト',               slug: 'naruto' },
  { name: 'Dragon Ball',                      nameJa: 'ドラゴンボール',        slug: 'dragon-ball' },
  { name: 'One Piece',                        nameJa: 'ワンピース',           slug: 'one-piece' },
  { name: 'Attack on Titan',                  nameJa: '進撃の巨人',           slug: 'attack-on-titan' },
  { name: 'Demon Slayer',                     nameJa: '鬼滅の刃',             slug: 'demon-slayer' },
  { name: 'My Hero Academia',                 nameJa: '僕のヒーローアカデミア', slug: 'my-hero-academia' },
  { name: 'Death Note',                       nameJa: 'デスノート',           slug: 'death-note' },
  { name: 'Fullmetal Alchemist Brotherhood',  nameJa: '鋼の錬金術師',          slug: 'fullmetal-alchemist-brotherhood' },
  { name: 'Hunter x Hunter',                  nameJa: 'ハンターハンター',      slug: 'hunter-x-hunter' },
  { name: 'Jujutsu Kaisen',                   nameJa: '呪術廻戦',             slug: 'jujutsu-kaisen' },
  { name: 'Música',                           nameJa: '音楽',                 slug: 'musica' },
  { name: 'Aniversarios',                     nameJa: '記念日',               slug: 'aniversarios' },
  { name: 'Stage Play',                       nameJa: '舞台',                 slug: 'stage-play' },
  { name: 'Bleach',                           nameJa: 'ブリーチ',             slug: 'bleach' },
  { name: 'Dandadan',                         nameJa: 'ダンダダン',           slug: 'dandadan' },
  { name: 'Konnichiwa Festival',              nameJa: 'こんにちは祭り',        slug: 'konnichiwa-festival' },
  { name: 'Haikyuu',                          nameJa: 'ハイキュー',           slug: 'haikyuu' },
];

async function main() {
  console.log(`Seeding ${ARTICLE_CATEGORIES.length} article categories...`);

  let created = 0;
  let updated = 0;

  for (const cat of ARTICLE_CATEGORIES) {
    const result = await prisma.articleCategory.upsert({
      where:  { slug: cat.slug },
      update: { name: cat.name, nameJa: cat.nameJa },
      create: { name: cat.name, nameJa: cat.nameJa, slug: cat.slug },
    });
    const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
    if (isNew) { created++; console.log(`  ✓ ${cat.name} — ${cat.nameJa}`); }
    else        { updated++; console.log(`  ↺ ${cat.name} — ${cat.nameJa}`); }
  }

  console.log(`\nDone — ${created} created, ${updated} updated.`);
  const total = await prisma.articleCategory.count();
  console.log(`Total article_categories in DB: ${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
