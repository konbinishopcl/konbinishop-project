/**
 * Seed de konbini-nest-api.
 * Idempotente: limpia todas las tablas y vuelve a poblar con datos de ejemplo.
 * Geografía: Chile como Country, 16 regiones como States, comunas como Cities.
 * Ejecutar: yarn prisma:seed
 */
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

/** Genera un slug url-safe: minúsculas, sin acentos, separado por guiones. */
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─────────────── Regiones y comunas de Chile ───────────────
const regionsData: { region: string; communes: string[] }[] = [
  { region: 'Arica y Parinacota', communes: ['Arica', 'Camarones', 'Putre', 'General Lagos'] },
  {
    region: 'Tarapacá',
    communes: ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Camiña', 'Colchane', 'Huara', 'Pica'],
  },
  {
    region: 'Antofagasta',
    communes: [
      'Antofagasta', 'Mejillones', 'Sierra Gorda', 'Taltal', 'Calama', 'Ollagüe',
      'San Pedro de Atacama', 'Tocopilla', 'María Elena',
    ],
  },
  {
    region: 'Atacama',
    communes: [
      'Copiapó', 'Caldera', 'Tierra Amarilla', 'Chañaral', 'Diego de Almagro', 'Vallenar',
      'Alto del Carmen', 'Freirina', 'Huasco',
    ],
  },
  {
    region: 'Coquimbo',
    communes: [
      'La Serena', 'Coquimbo', 'Andacollo', 'La Higuera', 'Paiguano', 'Vicuña', 'Illapel',
      'Canela', 'Los Vilos', 'Salamanca', 'Ovalle', 'Combarbalá', 'Monte Patria', 'Punitaqui',
      'Río Hurtado',
    ],
  },
  {
    region: 'Valparaíso',
    communes: [
      'Valparaíso', 'Casablanca', 'Concón', 'Juan Fernández', 'Puchuncaví', 'Quintero',
      'Viña del Mar', 'Isla de Pascua', 'Los Andes', 'Calle Larga', 'Rinconada', 'San Esteban',
      'La Ligua', 'Cabildo', 'Papudo', 'Petorca', 'Zapallar', 'Quillota', 'Calera', 'Hijuelas',
      'La Cruz', 'Nogales', 'San Antonio', 'Algarrobo', 'Cartagena', 'El Quisco', 'El Tabo',
      'Santo Domingo', 'San Felipe', 'Catemu', 'Llaillay', 'Panquehue', 'Putaendo', 'Santa María',
      'Quilpué', 'Limache', 'Olmué', 'Villa Alemana',
    ],
  },
  {
    region: "Región del Libertador Gral. Bernardo O'Higgins",
    communes: [
      'Rancagua', 'Codegua', 'Coinco', 'Coltauco', 'Doñihue', 'Graneros', 'Las Cabras',
      'Machalí', 'Malloa', 'Mostazal', 'Olivar', 'Peumo', 'Pichidegua', 'Quinta de Tilcoco',
      'Rengo', 'Requínoa', 'San Vicente', 'Pichilemu', 'La Estrella', 'Litueche', 'Marchihue',
      'Navidad', 'Paredones', 'San Fernando', 'Chépica', 'Chimbarongo', 'Lolol', 'Nancagua',
      'Palmilla', 'Peralillo', 'Placilla', 'Pumanque', 'Santa Cruz',
    ],
  },
  {
    region: 'Región del Maule',
    communes: [
      'Talca', 'Constitución', 'Curepto', 'Empedrado', 'Maule', 'Pelarco', 'Pencahue',
      'Río Claro', 'San Clemente', 'San Rafael', 'Cauquenes', 'Chanco', 'Pelluhue', 'Curicó',
      'Hualañé', 'Licantén', 'Molina', 'Rauco', 'Romeral', 'Sagrada Familia', 'Teno',
      'Vichuquén', 'Linares', 'Colbún', 'Longaví', 'Parral', 'Retiro', 'San Javier',
      'Villa Alegre', 'Yerbas Buenas',
    ],
  },
  {
    region: 'Región de Ñuble',
    communes: [
      'Cobquecura', 'Coelemu', 'Ninhue', 'Portezuelo', 'Quirihue', 'Ránquil', 'Treguaco',
      'Bulnes', 'Chillán Viejo', 'Chillán', 'El Carmen', 'Pemuco', 'Pinto', 'Quillón',
      'San Ignacio', 'Yungay', 'Coihueco', 'Ñiquén', 'San Carlos', 'San Fabián', 'San Nicolás',
    ],
  },
  {
    region: 'Región del Biobío',
    communes: [
      'Concepción', 'Coronel', 'Chiguayante', 'Florida', 'Hualqui', 'Lota', 'Penco',
      'San Pedro de la Paz', 'Santa Juana', 'Talcahuano', 'Tomé', 'Hualpén', 'Lebu', 'Arauco',
      'Cañete', 'Contulmo', 'Curanilahue', 'Los Álamos', 'Tirúa', 'Los Ángeles', 'Antuco',
      'Cabrero', 'Laja', 'Mulchén', 'Nacimiento', 'Negrete', 'Quilaco', 'Quilleco',
      'San Rosendo', 'Santa Bárbara', 'Tucapel', 'Yumbel', 'Alto Biobío',
    ],
  },
  {
    region: 'Región de la Araucanía',
    communes: [
      'Temuco', 'Carahue', 'Cunco', 'Curarrehue', 'Freire', 'Galvarino', 'Gorbea', 'Lautaro',
      'Loncoche', 'Melipeuco', 'Nueva Imperial', 'Padre las Casas', 'Perquenco', 'Pitrufquén',
      'Pucón', 'Saavedra', 'Teodoro Schmidt', 'Toltén', 'Vilcún', 'Villarrica', 'Cholchol',
      'Angol', 'Collipulli', 'Curacautín', 'Ercilla', 'Lonquimay', 'Los Sauces', 'Lumaco',
      'Purén', 'Renaico', 'Traiguén', 'Victoria',
    ],
  },
  {
    region: 'Región de Los Ríos',
    communes: [
      'Valdivia', 'Corral', 'Lanco', 'Los Lagos', 'Máfil', 'Mariquina', 'Paillaco',
      'Panguipulli', 'La Unión', 'Futrono', 'Lago Ranco', 'Río Bueno',
    ],
  },
  {
    region: 'Región de Los Lagos',
    communes: [
      'Puerto Montt', 'Calbuco', 'Cochamó', 'Fresia', 'Frutillar', 'Los Muermos', 'Llanquihue',
      'Maullín', 'Puerto Varas', 'Castro', 'Ancud', 'Chonchi', 'Curaco de Vélez', 'Dalcahue',
      'Puqueldón', 'Queilén', 'Quellón', 'Quemchi', 'Quinchao', 'Osorno', 'Puerto Octay',
      'Purranque', 'Puyehue', 'Río Negro', 'San Juan de la Costa', 'San Pablo', 'Chaitén',
      'Futaleufú', 'Hualaihué', 'Palena',
    ],
  },
  {
    region: 'Región Aisén del Gral. Carlos Ibáñez del Campo',
    communes: [
      'Coihaique', 'Lago Verde', 'Aisén', 'Cisnes', 'Guaitecas', 'Cochrane', "O'Higgins",
      'Tortel', 'Chile Chico', 'Río Ibáñez',
    ],
  },
  {
    region: 'Región de Magallanes y de la Antártica Chilena',
    communes: [
      'Punta Arenas', 'Laguna Blanca', 'Río Verde', 'San Gregorio', 'Cabo de Hornos (Ex Navarino)',
      'Antártica', 'Porvenir', 'Primavera', 'Timaukel', 'Natales', 'Torres del Paine',
    ],
  },
  {
    region: 'Región Metropolitana de Santiago',
    communes: [
      'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central', 'Huechuraba',
      'Independencia', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 'La Reina',
      'Las Condes', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa',
      'Pedro Aguirre Cerda', 'Peñalolén', 'Providencia', 'Pudahuel', 'Quilicura',
      'Quinta Normal', 'Recoleta', 'Renca', 'Santiago', 'San Joaquín', 'San Miguel', 'San Ramón',
      'Vitacura', 'Puente Alto', 'Pirque', 'San José de Maipo', 'Colina', 'Lampa', 'Tiltil',
      'San Bernardo', 'Buin', 'Calera de Tango', 'Paine', 'Melipilla', 'Alhué', 'Curacaví',
      'María Pinto', 'San Pedro', 'Talagante', 'El Monte', 'Isla de Maipo', 'Padre Hurtado',
      'Peñaflor',
    ],
  },
];

async function main() {
  console.log('🌱 Seeding konbini-nest-api...');

  // ── Limpieza (orden FK-safe) ──
  await prisma.like.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.subscriber.deleteMany();
  await prisma.event.deleteMany();
  await prisma.eventCategory.deleteMany();
  await prisma.articleImage.deleteMany();
  await prisma.article.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.articleCategory.deleteMany();
  await prisma.hero.deleteMany();
  await prisma.spot.deleteMany();
  // Geografía: City → State → Country
  await prisma.city.deleteMany();
  await prisma.state.deleteMany();
  await prisma.country.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // ── Geografía: Chile como Country, regiones como States, comunas como Cities ──

  // 1. País Chile
  const chile = await prisma.country.upsert({
    where: { slug: 'chile' },
    update: {},
    create: { name: 'Chile', slug: 'chile' },
  });

  // 2. States (16 regiones) y Cities (comunas)
  for (const { region, communes } of regionsData) {
    const stateSlug = slugify(region);
    const state = await prisma.state.upsert({
      where: { slug: stateSlug },
      update: { name: region, countryId: chile.id },
      create: { name: region, slug: stateSlug, countryId: chile.id },
    });

    for (const communeName of communes) {
      const citySlug = slugify(communeName);
      await prisma.city.upsert({
        where: { slug: citySlug },
        update: { name: communeName, stateId: state.id },
        create: { name: communeName, slug: citySlug, stateId: state.id },
      });
    }
  }

  const totalCities = regionsData.reduce((acc, r) => acc + r.communes.length, 0);
  console.log(`✓ Geografía seeded: 1 country, ${regionsData.length} states, ${totalCities} cities`);

  // Mapa slug -> registro de ciudad, para referenciar en eventos
  const cityBySlug = new Map(
    (await prisma.city.findMany()).map((c) => [c.slug, c]),
  );
  const city = (slug: string) => {
    const c = cityBySlug.get(slug);
    if (!c) throw new Error(`Ciudad no encontrada: ${slug}`);
    return c;
  };

  // ── Categorías de evento ──
  const musica = await prisma.eventCategory.create({
    data: { name: 'Música', slug: 'musica', description: 'Conciertos y festivales.' },
  });
  const teatro = await prisma.eventCategory.create({
    data: { name: 'Teatro', slug: 'teatro', description: 'Obras y artes escénicas.' },
  });
  const gastronomia = await prisma.eventCategory.create({
    data: { name: 'Gastronomía', slug: 'gastronomia', description: 'Ferias y eventos gastronómicos.' },
  });
  const animeManga = await prisma.eventCategory.create({
    data: { name: 'Anime y Manga', slug: 'anime-y-manga', description: 'Convenciones de cultura otaku.' },
  });
  const videojuegos = await prisma.eventCategory.create({
    data: { name: 'Videojuegos', slug: 'videojuegos', description: 'eSports y cultura gamer.' },
  });

  // ── Categorías de artículo ──
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
  for (const cat of ARTICLE_CATEGORIES) {
    await prisma.articleCategory.create({ data: cat });
  }
  console.log(`✓ Article categories seeded: ${ARTICLE_CATEGORIES.length}`);

  // ── Artículos desde datos exportados de WordPress ──
  const articlesDataPath = join(process.cwd(), 'prisma', 'data', 'articles.json');
  if (existsSync(articlesDataPath)) {
    const articlesData: Array<{
      title: string;
      slug: string;
      excerpt: string | null;
      content: string;
      image: string | null;
      youtubeUrl: string | null;
      categorySlugs: string[];
      tags: Array<{ name: string; slug: string }>;
      gallery: string[];
      createdAt: string;
      updatedAt: string;
    }> = JSON.parse(readFileSync(articlesDataPath, 'utf-8'));

    const sanitize = (s: string | null) =>
      s ? s.replace(/\\x[0-9a-fA-F]{0,1}(?![0-9a-fA-F])/g, '').replace(/\x00/g, '') : s;

    const dbCategories = await prisma.articleCategory.findMany({ select: { id: true, slug: true } });
    const catBySlug: Record<string, number> = {};
    for (const c of dbCategories) catBySlug[c.slug] = c.id;

    let articleCount = 0;
    for (const art of articlesData) {
      // Anti-P2025 filter: skip slugs not in the curated DB list (unknown slugs throw P2025 which
      // skips the entire article — data loss). ArticleCategory has required nameJa so we never
      // auto-create categories at seed time (they'd have null nameJa and pollute the MegaMenu).
      const knownSlugs = (art.categorySlugs ?? []).filter(s => catBySlug[s] !== undefined);

      const tagIds: number[] = [];
      for (const tag of art.tags) {
        if (!tag.slug) continue;
        const t = await prisma.articleTag.upsert({
          where:  { slug: tag.slug },
          update: {},
          create: { name: tag.name, slug: tag.slug },
        });
        tagIds.push(t.id);
      }

      try { await prisma.article.upsert({
        where: { slug: art.slug },
        update: {
          title: art.title,
          excerpt: sanitize(art.excerpt),
          content: sanitize(art.content)!,
          image: art.image,
          youtubeUrl: art.youtubeUrl,
          articleCategories: { set: knownSlugs.map(slug => ({ slug })) },
          status: 'APPROVED',
          articleTags: tagIds.length ? { set: tagIds.map(id => ({ id })) } : undefined,
          articleImages: {
            deleteMany: {},
            create: art.gallery.map((url, i) => ({ url, order: i })),
          },
        },
        create: {
          title: art.title,
          slug: art.slug,
          excerpt: sanitize(art.excerpt),
          content: sanitize(art.content)!,
          image: art.image,
          youtubeUrl: art.youtubeUrl,
          articleCategories: knownSlugs.length ? { connect: knownSlugs.map(slug => ({ slug })) } : undefined,
          status: 'APPROVED',
          createdAt: new Date(art.createdAt),
          updatedAt: new Date(art.updatedAt),
          articleTags: tagIds.length ? { connect: tagIds.map(id => ({ id })) } : undefined,
          articleImages: {
            create: art.gallery.map((url, i) => ({ url, order: i })),
          },
        },
      }); articleCount++; } catch (e: any) {
        console.warn(`  ⚠ skipped "${art.slug}": ${e.message?.slice(0, 300)}`);
      }
    }
    console.log(`✓ Articles seeded: ${articleCount} from prisma/data/articles.json`);
  } else {
    console.warn('⚠ prisma/data/articles.json not found — run npx ts-node prisma/export-wp-articles.ts first');
  }

  // ── Usuarios (sistema local; un usuario por cada rol) ──
  const passwordHash = await hash('konbini123', 10);
  await prisma.user.create({
    data: {
      email: 'superadmin@konbini.cl',
      passwordHash,
      firstname: 'Super',
      lastname: 'Admin',
      role: 'SUPER_ADMIN',
      confirmed: true,
    },
  });
  const admin = await prisma.user.create({
    data: {
      email: 'admin@konbini.cl',
      passwordHash,
      firstname: 'Equipo',
      lastname: 'Konbini',
      role: 'ADMIN',
      confirmed: true,
    },
  });
  const organizer = await prisma.user.create({
    data: {
      email: 'organizador@konbini.cl',
      passwordHash,
      firstname: 'Camila',
      lastname: 'Rojas',
      rut: '12.345.678-9',
      isCompany: false,
      role: 'AUTHENTICATED',
      confirmed: true,
    },
  });

  // ── Spots: paid ads shown among the event cards (created after the owner user) ──
  await prisma.spot.createMany({
    data: [
      {
        title: 'Arrienda tu local para eventos',
        image: 'https://placehold.co/600x300/png',
        linkType: 'URL',
        linkValue: 'https://example.cl/arriendo-de-locales',
        expirationDate: new Date('2026-12-31'),
        status: 'APPROVED',
        userId: organizer.id,
      },
      {
        title: 'Sonido e iluminación — llámanos',
        linkType: 'PHONE',
        linkValue: '+56912345678',
        expirationDate: new Date('2026-11-30'),
        status: 'APPROVED',
        userId: organizer.id,
      },
      {
        title: 'Cotiza tu stand para convenciones',
        image: 'https://placehold.co/600x300/png',
        linkType: 'EMAIL',
        linkValue: 'ventas@example.cl',
        status: 'APPROVED',
        userId: organizer.id,
      },
    ],
  });

  // ── Heroes: paid placements shown in the home hero carousel ──
  await prisma.hero.createMany({
    data: [
      {
        title: 'Festival de',
        titleAccent: 'Primavera 2026',
        lead: 'Dos días de música en vivo en el corazón de Santiago.',
        image: 'https://2w45nhh8p6jdklcj.public.blob.vercel-storage.com/seed/hero-1.webp',
        date: new Date('2026-09-21'),
        place: "Parque O'Higgins, Santiago",
        link: 'https://example.cl/festival-de-primavera',
        eventCategoryId: musica.id,
        userId: organizer.id,
        status: 'APPROVED',
        days: 30,
        amount: 30 * 15000,
        expirationDate: new Date('2026-09-22'),
      },
      {
        title: 'Expo Otaku',
        titleAccent: 'Viña 2026',
        lead: 'La convención otaku más grande de la región.',
        image: 'https://2w45nhh8p6jdklcj.public.blob.vercel-storage.com/seed/hero-2.webp',
        date: new Date('2026-10-12'),
        place: 'Centro de Convenciones, Viña del Mar',
        link: 'https://example.cl/expo-otaku-vina',
        eventCategoryId: animeManga.id,
        userId: organizer.id,
        status: 'APPROVED',
        days: 30,
        amount: 30 * 15000,
        expirationDate: new Date('2026-10-13'),
      },
    ],
  });

  // ── Eventos (con componentes) ──
  // Imágenes curadas reales (subset) alojadas en Vercel Blob bajo /seed/.
  // Las imágenes que suban los usuarios van al mismo store — ver UploadsService.
  const BLOB = 'https://2w45nhh8p6jdklcj.public.blob.vercel-storage.com/seed';
  const catId: Record<string, number> = {
    musica: musica.id,
    teatro: teatro.id,
    gastronomia: gastronomia.id,
    anime: animeManga.id,
    videojuegos: videojuegos.id,
  };

  type SeedEvent = {
    title: string;
    company: string;
    description: string;
    about?: string;
    expirationDate: string;
    address: string;
    addressNumber: string;
    ticketUrl?: string;
    cats: string[];
    citySlug: string;
    approved: boolean;
    prices: { name: string; price: number }[];
    dates: { date: string; startTime: string; endTime: string }[];
    socials?: string[];
    videos?: string[];
    img: number; // índice de /uploads/poster-N.jpg y /uploads/banner-N.jpg
  };

  const eventsData: SeedEvent[] = [
    {
      title: 'Konbini Live Fest',
      company: 'Konbini Producciones',
      description: 'Festival de bandas indie y rock nacional con dos escenarios.',
      about: 'Una jornada completa con más de diez bandas en vivo.',
      expirationDate: '2026-11-15',
      address: 'Av. Matta', addressNumber: '890',
      ticketUrl: 'https://entradas.example.cl/konbini-live-fest',
      cats: ['musica'], citySlug: 'santiago',
      approved: true, img: 1,
      prices: [
        { name: 'Entrada general', price: 15000 },
        { name: 'Entrada VIP', price: 35000 },
      ],
      dates: [{ date: '2026-11-14', startTime: '18:00', endTime: '23:30' }],
      socials: ['https://instagram.com/konbinilivefest'],
      videos: ['https://youtube.com/watch?v=konbini-live'],
    },
    {
      title: 'Expo Anime Concepción',
      company: 'Otaku Sur SpA',
      description: 'Convención de anime, manga y videojuegos en el Biobío.',
      about: 'Concursos de cosplay, zona gamer y artistas invitados.',
      expirationDate: '2026-10-20',
      address: 'Barros Arana', addressNumber: '321',
      ticketUrl: 'https://entradas.example.cl/expo-anime-concepcion',
      cats: ['anime', 'videojuegos'], citySlug: 'concepcion',
      approved: true, img: 2,
      prices: [{ name: 'Entrada por día', price: 8000 }],
      dates: [
        { date: '2026-10-18', startTime: '10:00', endTime: '20:00' },
        { date: '2026-10-19', startTime: '10:00', endTime: '20:00' },
      ],
      socials: ['https://instagram.com/expoanimeccp'],
    },
    {
      title: 'Festival J-Rock Santiago',
      company: 'Rising Sun Live',
      description: 'Lo mejor del rock japonés en una noche con bandas invitadas.',
      about: 'Tributo y bandas originales de J-Rock y visual kei.',
      expirationDate: '2026-09-13',
      address: 'Av. Providencia', addressNumber: '2594',
      ticketUrl: 'https://entradas.example.cl/festival-j-rock-santiago',
      cats: ['musica'], citySlug: 'providencia',
      approved: true, img: 3,
      prices: [{ name: 'Entrada general', price: 22000 }],
      dates: [{ date: '2026-09-12', startTime: '19:00', endTime: '23:00' }],
      socials: ['https://instagram.com/jrockstgo'],
    },
    {
      title: 'Convención Cosplay Valparaíso',
      company: 'Puerto Geek',
      description: 'Concurso de cosplay, talleres y feria de artistas en el puerto.',
      about: 'Pasarela principal, jueces invitados y zona de fotografía.',
      expirationDate: '2026-08-23',
      address: 'Plaza Sotomayor', addressNumber: '233',
      ticketUrl: 'https://entradas.example.cl/convencion-cosplay-valparaiso',
      cats: ['anime'], citySlug: 'valparaiso',
      approved: true, img: 4,
      prices: [
        { name: 'Entrada general', price: 12000 },
        { name: 'Pase día completo', price: 18000 },
      ],
      dates: [{ date: '2026-08-22', startTime: '11:00', endTime: '21:00' }],
      socials: ['https://instagram.com/puertogeek'],
    },
    {
      title: 'eSports Konbini Cup',
      company: 'Konbini Gaming',
      description: 'Torneo de eSports con competencias de varios títulos.',
      about: 'Fase de grupos, playoffs y gran final con premios.',
      expirationDate: '2026-07-27',
      address: 'Av. Apoquindo', addressNumber: '4500',
      ticketUrl: 'https://entradas.example.cl/esports-konbini-cup',
      cats: ['videojuegos'], citySlug: 'las-condes',
      approved: true, img: 5,
      prices: [{ name: 'Entrada general', price: 10000 }],
      dates: [
        { date: '2026-07-25', startTime: '09:00', endTime: '22:00' },
        { date: '2026-07-26', startTime: '09:00', endTime: '22:00' },
      ],
      socials: ['https://instagram.com/konbinigaming'],
    },
    {
      title: 'Anime Sinfónico en Vivo',
      company: 'Orquesta Geek',
      description: 'Las bandas sonoras del anime interpretadas por orquesta.',
      about: 'Un repertorio de clásicos del anime con orquesta completa.',
      expirationDate: '2026-10-04',
      address: 'Av. Matucana', addressNumber: '100',
      ticketUrl: 'https://entradas.example.cl/anime-sinfonico-en-vivo',
      cats: ['musica', 'teatro'], citySlug: 'santiago',
      approved: true, img: 6,
      prices: [
        { name: 'Platea', price: 28000 },
        { name: 'Palco', price: 45000 },
      ],
      dates: [{ date: '2026-10-03', startTime: '20:00', endTime: '22:30' }],
      socials: ['https://instagram.com/orquestageek'],
    },
    {
      title: 'Maratón de Cine Animado',
      company: 'Cine Club Otaku',
      description: 'Una jornada de proyecciones de cine animado en pantalla grande.',
      about: 'Selección de películas animadas con foro entre funciones.',
      expirationDate: '2026-09-28',
      address: 'Av. San Martín', addressNumber: '880',
      ticketUrl: 'https://entradas.example.cl/maraton-de-cine-animado',
      cats: ['teatro'], citySlug: 'vina-del-mar',
      approved: true, img: 7,
      prices: [{ name: 'Entrada', price: 6000 }],
      dates: [{ date: '2026-09-27', startTime: '14:00', endTime: '23:00' }],
    },
    {
      title: 'Expo Manga Antofagasta',
      company: 'Norte Otaku',
      description: 'Feria del manga con editoriales, autores y firma de ejemplares.',
      about: 'Stands de editoriales, charlas y zona de ilustradores.',
      expirationDate: '2026-11-08',
      address: 'Av. Argentina', addressNumber: '1962',
      ticketUrl: 'https://entradas.example.cl/expo-manga-antofagasta',
      cats: ['anime'], citySlug: 'antofagasta',
      approved: true, img: 8,
      prices: [{ name: 'Entrada por día', price: 7000 }],
      dates: [{ date: '2026-11-07', startTime: '10:00', endTime: '19:00' }],
      socials: ['https://instagram.com/norteotaku'],
    },
    {
      title: 'Feria Retro Gaming',
      company: 'Pixel Club',
      description: 'Consolas clásicas, arcades y venta de videojuegos retro.',
      about: 'Zona de arcades libres, torneos casuales y feria de coleccionismo.',
      expirationDate: '2026-08-10',
      address: 'Av. Irarrázaval', addressNumber: '3700',
      ticketUrl: 'https://entradas.example.cl/feria-retro-gaming',
      cats: ['videojuegos'], citySlug: 'nunoa',
      approved: true, img: 9,
      prices: [{ name: 'Entrada general', price: 5000 }],
      dates: [{ date: '2026-08-09', startTime: '12:00', endTime: '20:00' }],
    },
    {
      title: 'Mercado Geek Gastronómico',
      company: 'Sabores Otaku',
      description: 'Food trucks de cocina japonesa y feria geek al aire libre.',
      about: 'Cocina temática, food trucks y stands de artistas.',
      expirationDate: '2026-12-07',
      address: 'Parque Bustamante', addressNumber: 's/n',
      cats: ['gastronomia', 'anime'], citySlug: 'santiago',
      approved: true, img: 10,
      prices: [{ name: 'Acceso liberado', price: 0 }],
      dates: [{ date: '2026-12-06', startTime: '12:00', endTime: '22:00' }],
    },
    {
      title: 'Teatro Kabuki Contemporáneo',
      company: 'Compañía Hanami',
      description: 'Una puesta en escena que reinterpreta el teatro kabuki.',
      about: 'Vestuario tradicional y narrativa contemporánea.',
      expirationDate: '2026-09-20',
      address: 'Av. Francisco de Aguirre', addressNumber: '210',
      ticketUrl: 'https://entradas.example.cl/teatro-kabuki-contemporaneo',
      cats: ['teatro'], citySlug: 'la-serena',
      approved: true, img: 11,
      prices: [{ name: 'Entrada general', price: 14000 }],
      dates: [{ date: '2026-09-19', startTime: '20:00', endTime: '22:00' }],
    },
    {
      title: 'Encuentro Otaku Temuco',
      company: 'Sur Geek',
      description: 'Encuentro de la comunidad otaku del sur con feria y concursos.',
      about: 'Concurso de cosplay, karaoke japonés y feria de fanzines.',
      expirationDate: '2026-11-22',
      address: 'Av. Alemania', addressNumber: '0671',
      ticketUrl: 'https://entradas.example.cl/encuentro-otaku-temuco',
      cats: ['anime'], citySlug: 'temuco',
      approved: false, img: 12,
      prices: [{ name: 'Entrada general', price: 6000 }],
      dates: [{ date: '2026-11-21', startTime: '11:00', endTime: '20:00' }],
      socials: ['https://instagram.com/surgeek'],
    },
  ];

  for (const ev of eventsData) {
    await prisma.event.create({
      data: {
        title: ev.title,
        company: ev.company,
        slug: slugify(ev.title),
        description: ev.description,
        about: ev.about,
        expirationDate: new Date(ev.expirationDate),
        address: ev.address,
        addressNumber: ev.addressNumber,
        ticketUrl: ev.ticketUrl,
        banner: `${BLOB}/banner-${ev.img}.webp`,
        poster: `${BLOB}/poster-${ev.img}.webp`,
        gallery: [`${BLOB}/poster-${ev.img}.webp`, `${BLOB}/banner-${ev.img}.webp`],
        status: ev.approved ? 'APPROVED' : 'PENDING_MODERATION',
        userId: organizer.id,
        approvedById: ev.approved ? admin.id : null,
        cityId: city(ev.citySlug).id,
        eventCategoryId: catId[ev.cats[0]] ?? null,
        prices: { create: ev.prices },
        dates: {
          create: ev.dates.map((d) => ({
            date: new Date(d.date),
            startTime: d.startTime,
            endTime: d.endTime,
          })),
        },
        socialLinks: ev.socials?.length
          ? { create: ev.socials.map((l) => ({ link: l })) }
          : undefined,
        videos: ev.videos?.length
          ? { create: ev.videos.map((l) => ({ link: l })) }
          : undefined,
      },
    });
  }

  // ── Perfiles ──
  for (const u of [
    { id: (await prisma.user.findUnique({ where: { email: 'superadmin@konbini.cl' }, select: { id: true } }))!.id, displayName: 'Super Admin', slug: 'superadmin' },
    { id: (await prisma.user.findUnique({ where: { email: 'admin@konbini.cl' }, select: { id: true } }))!.id, displayName: 'Equipo Konbini', slug: 'equipo-konbini' },
    { id: (await prisma.user.findUnique({ where: { email: 'organizador@konbini.cl' }, select: { id: true } }))!.id, displayName: 'Camila Rojas', slug: 'camila-rojas' },
  ]) {
    await prisma.profile.upsert({
      where: { userId: u.id },
      create: { userId: u.id, displayName: u.displayName, slug: u.slug },
      update: {},
    });
  }

  // ── Likes en eventos y artículos ──
  const allEvents = await prisma.event.findMany({ select: { id: true }, take: 6 });
  const allArticles = await prisma.article.findMany({ select: { id: true } });
  const organizadorId = (await prisma.user.findUnique({ where: { email: 'organizador@konbini.cl' }, select: { id: true } }))!.id;
  const adminId = (await prisma.user.findUnique({ where: { email: 'admin@konbini.cl' }, select: { id: true } }))!.id;
  for (const ev of allEvents.slice(0, 4)) {
    await prisma.like.createMany({ data: [{ userId: organizadorId, eventId: ev.id }, { userId: adminId, eventId: ev.id }], skipDuplicates: true });
  }
  for (const ev of allEvents.slice(4)) {
    await prisma.like.createMany({ data: [{ userId: organizadorId, eventId: ev.id }], skipDuplicates: true });
  }
  for (const art of allArticles) {
    await prisma.like.createMany({ data: [{ userId: organizadorId, articleId: art.id }], skipDuplicates: true });
  }

  // ─────────────── Settings defaults (v2 — Phase 8) ───────────────
  // Estos valores existen en la DB desde Phase 8, pero el código de aplicación
  // sigue leyendo de env vars hasta que Phase 11 los migre a leer de Settings.

  const settingsDefaults: { key: string; value: string }[] = [
    { key: 'SPOT_PRICE_PER_DAY',          value: '8000' },
    { key: 'SPOT_MIN_DAYS',               value: '10' },
    { key: 'SPOT_MAX_DAYS',               value: '30' },
    { key: 'SPOT_MAX_ACTIVE',             value: '10' },
    { key: 'HERO_PRICE_PER_DAY',          value: '15000' },
    { key: 'HERO_MIN_DAYS',               value: '10' },
    { key: 'HERO_MAX_DAYS',               value: '30' },
    { key: 'HERO_MAX_ACTIVE',             value: '5' },
    { key: 'SUBSCRIPTION_PRICE',          value: '9990' },
    { key: 'SUBSCRIPTION_CREDITS',        value: '10' },
    { key: 'SUBSCRIPTION_SPOT_DISCOUNT',  value: '20' },
    { key: 'SUBSCRIPTION_HERO_DISCOUNT',  value: '20' },
    { key: 'EVENT_MAX_DAYS',              value: '60' },
    { key: 'ARTICLE_PRICE',               value: '5000' },
  ];

  for (const setting of settingsDefaults) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: {},  // NO sobreescribir si el admin ya cambió el valor
      create: setting,
    });
  }

  console.log(`✓ Settings seeded: ${settingsDefaults.length} defaults (upsert no-op si existían)`);

  // ── LegalDocuments ──
  await prisma.legalDocument.upsert({
    where: { type: 'PRIVACY_POLICY' },
    create: {
      type: 'PRIVACY_POLICY',
      content: `# Política de Privacidad — Konbini

Konbini trata los datos personales que nos proporcionas de acuerdo con la Ley N° 21.719
de Protección de Datos Personales de Chile y las demás normas aplicables.

## Datos que recopilamos

Recopilamos los datos que nos proporcionas al registrarte (nombre, correo electrónico,
contraseña), los datos de los eventos que publicas y los datos técnicos de uso de la
plataforma.

## Registros de auditoría

Para garantizar la trazabilidad y la seguridad de la plataforma, Konbini registra
las acciones administrativas y de publicación que realizan los usuarios sobre los
contenidos del sistema (eventos, avisos y portadas). Cada registro incluye la fecha,
la acción realizada, la entidad afectada y, cuando corresponde, la dirección IP y el
agente de usuario (navegador) desde el que se originó la acción.

La dirección IP y el agente de usuario constituyen datos personales conforme a la
Ley N° 21.719. Se tratan con la única finalidad de auditoría y seguridad, y se
conservan por un plazo máximo de 24 meses, transcurrido el cual son eliminados. El
titular puede ejercer sus derechos de acceso, rectificación y supresión sobre estos
registros conforme a la ley vigente.

## Tus derechos

Puedes ejercer tus derechos de acceso, rectificación, supresión, portabilidad y oposición
escribiéndonos a hola@konbini.cl.`,
    },
    update: {
      content: `# Política de Privacidad — Konbini

Konbini trata los datos personales que nos proporcionas de acuerdo con la Ley N° 21.719
de Protección de Datos Personales de Chile y las demás normas aplicables.

## Datos que recopilamos

Recopilamos los datos que nos proporcionas al registrarte (nombre, correo electrónico,
contraseña), los datos de los eventos que publicas y los datos técnicos de uso de la
plataforma.

## Registros de auditoría

Para garantizar la trazabilidad y la seguridad de la plataforma, Konbini registra
las acciones administrativas y de publicación que realizan los usuarios sobre los
contenidos del sistema (eventos, avisos y portadas). Cada registro incluye la fecha,
la acción realizada, la entidad afectada y, cuando corresponde, la dirección IP y el
agente de usuario (navegador) desde el que se originó la acción.

La dirección IP y el agente de usuario constituyen datos personales conforme a la
Ley N° 21.719. Se tratan con la única finalidad de auditoría y seguridad, y se
conservan por un plazo máximo de 24 meses, transcurrido el cual son eliminados. El
titular puede ejercer sus derechos de acceso, rectificación y supresión sobre estos
registros conforme a la ley vigente.

## Tus derechos

Puedes ejercer tus derechos de acceso, rectificación, supresión, portabilidad y oposición
escribiéndonos a hola@konbini.cl.`,
    },
  });

  // ── Conteo final ──
  const counts = {
    countries: await prisma.country.count(),
    states: await prisma.state.count(),
    cities: await prisma.city.count(),
    eventCategories: await prisma.eventCategory.count(),
    articleTags: await prisma.articleTag.count(),
    articles: await prisma.article.count(),
    heroes: await prisma.hero.count(),
    spots: await prisma.spot.count(),
    events: await prisma.event.count(),
    users: await prisma.user.count(),
    profiles: await prisma.profile.count(),
    likes: await prisma.like.count(),
  };
  console.log('✅ Seed completo:', counts);
}

main()
  .catch((e) => {
    console.error('❌ Seed falló:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
