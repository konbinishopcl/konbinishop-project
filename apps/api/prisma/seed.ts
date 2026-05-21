/**
 * Seed de konbini-nest-api.
 * Idempotente: limpia todas las tablas y vuelve a poblar con datos de ejemplo.
 * Regiones y comunas: las 16 regiones de Chile completas (igual que el seeder de Strapi).
 * Ejecutar: yarn prisma:seed
 */
import { PrismaClient } from '@prisma/client';

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

  // ── Limpieza (orden FK-safe; los componentes de Event caen por cascade) ──
  await prisma.event.deleteMany();
  await prisma.article.deleteMany();
  await prisma.hero.deleteMany();
  await prisma.spot.deleteMany();
  await prisma.commune.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.region.deleteMany();
  await prisma.profile.deleteMany();

  // ── Regiones + comunas (las 16 regiones de Chile) ──
  const seenCommuneSlug = new Set<string>();
  for (const r of regionsData) {
    const region = await prisma.region.create({
      data: { name: r.region, slug: slugify(r.region) },
    });
    const communeRows = r.communes
      .map((name) => ({ name, slug: slugify(name), regionId: region.id }))
      .filter((c) => {
        if (seenCommuneSlug.has(c.slug)) return false;
        seenCommuneSlug.add(c.slug);
        return true;
      });
    await prisma.commune.createMany({ data: communeRows });
  }

  // Mapas slug -> registro, para referenciar regiones/comunas más abajo.
  const regionBySlug = new Map(
    (await prisma.region.findMany()).map((r) => [r.slug, r]),
  );
  const communeBySlug = new Map(
    (await prisma.commune.findMany()).map((c) => [c.slug, c]),
  );
  const region = (slug: string) => {
    const r = regionBySlug.get(slug);
    if (!r) throw new Error(`Región no encontrada: ${slug}`);
    return r;
  };
  const commune = (slug: string) => {
    const c = communeBySlug.get(slug);
    if (!c) throw new Error(`Comuna no encontrada: ${slug}`);
    return c;
  };

  // ── Categorías ──
  const musica = await prisma.category.create({
    data: { name: 'Música', slug: 'musica', description: 'Conciertos y festivales.' },
  });
  const teatro = await prisma.category.create({
    data: { name: 'Teatro', slug: 'teatro', description: 'Obras y artes escénicas.' },
  });
  const gastronomia = await prisma.category.create({
    data: { name: 'Gastronomía', slug: 'gastronomia', description: 'Ferias y eventos gastronómicos.' },
  });
  const animeManga = await prisma.category.create({
    data: { name: 'Anime y Manga', slug: 'anime-y-manga', description: 'Convenciones de cultura otaku.' },
  });
  const videojuegos = await prisma.category.create({
    data: { name: 'Videojuegos', slug: 'videojuegos', description: 'eSports y cultura gamer.' },
  });

  // ── Tags ──
  const rock = await prisma.tag.create({ data: { name: 'Rock', slug: 'rock' } });
  const indie = await prisma.tag.create({ data: { name: 'Indie', slug: 'indie' } });
  const cosplay = await prisma.tag.create({ data: { name: 'Cosplay', slug: 'cosplay' } });
  const gratis = await prisma.tag.create({ data: { name: 'Gratis', slug: 'gratis' } });
  const familiar = await prisma.tag.create({ data: { name: 'Familiar', slug: 'familiar' } });

  // ── Artículos ──
  await prisma.article.create({
    data: {
      title: 'Guía para tu primera convención de anime',
      slug: 'guia-primera-convencion-anime',
      excerpt: 'Todo lo que necesitas saber antes de armar tu cosplay.',
      content:
        'Las convenciones de anime son el punto de encuentro de la cultura otaku en Chile. ' +
        'En esta guía repasamos cómo prepararte, qué llevar y cómo aprovechar al máximo el evento.',
      tags: { connect: [{ id: cosplay.id }, { id: familiar.id }] },
    },
  });
  await prisma.article.create({
    data: {
      title: 'Los mejores escenarios indie de Santiago',
      slug: 'mejores-escenarios-indie-santiago',
      excerpt: 'Salas pequeñas donde nace la música nueva.',
      content:
        'La escena indie santiaguina vive en salas íntimas. Recorremos los espacios donde ' +
        'las bandas emergentes dan sus primeros conciertos.',
      tags: { connect: [{ id: indie.id }, { id: rock.id }] },
    },
  });
  await prisma.article.create({
    data: {
      title: 'Eventos gratuitos para ir en familia',
      slug: 'eventos-gratuitos-en-familia',
      excerpt: 'Panoramas sin costo para todas las edades.',
      content:
        'No siempre hay que pagar para pasarlo bien. Esta es nuestra selección de panoramas ' +
        'gratuitos y familiares a lo largo del país.',
      tags: { connect: [{ id: gratis.id }, { id: familiar.id }] },
    },
  });

  // ── Heroes (banners destacados) ──
  await prisma.hero.create({
    data: {
      title: 'Festival de Primavera 2026',
      slug: 'festival-de-primavera-2026',
      date: new Date('2026-09-21'),
      address: "Av. Bernardo O'Higgins",
      addressNumber: '1234',
      venue: "Parque O'Higgins",
      link: 'https://konbini.cl/eventos/festival-primavera-2026',
      desktopImage: 'https://placehold.co/1920x600/png',
      tabletImage: 'https://placehold.co/1024x500/png',
      mobileImage: 'https://placehold.co/768x800/png',
      thumbnail: 'https://placehold.co/400x400/png',
      expirationDate: new Date('2026-09-22'),
      regionId: region('region-metropolitana-de-santiago').id,
      communeId: commune('santiago').id,
      categories: { connect: [{ id: musica.id }] },
    },
  });
  await prisma.hero.create({
    data: {
      title: 'Expo Otaku Viña 2026',
      slug: 'expo-otaku-vina-2026',
      date: new Date('2026-10-12'),
      address: 'Av. San Martín',
      addressNumber: '567',
      venue: 'Centro de Convenciones Viña',
      link: 'https://konbini.cl/eventos/expo-otaku-vina-2026',
      desktopImage: 'https://placehold.co/1920x600/png',
      tabletImage: 'https://placehold.co/1024x500/png',
      mobileImage: 'https://placehold.co/768x800/png',
      thumbnail: 'https://placehold.co/400x400/png',
      expirationDate: new Date('2026-10-13'),
      regionId: region('valparaiso').id,
      communeId: commune('vina-del-mar').id,
      categories: { connect: [{ id: animeManga.id }, { id: videojuegos.id }] },
    },
  });

  // ── Spots (publicidad) ──
  await prisma.spot.createMany({
    data: [
      { title: 'Banner promocional verano', image: 'https://placehold.co/600x300/png', link: 'https://konbini.cl/promos/verano', expirationDate: new Date('2026-12-31') },
      { title: 'Spot patrocinador música', image: 'https://placehold.co/600x300/png', link: 'https://konbini.cl/promos/musica', expirationDate: new Date('2026-11-30') },
      { title: 'Spot convención gamer', image: 'https://placehold.co/600x300/png', link: 'https://konbini.cl/promos/gamer', expirationDate: new Date('2026-10-31') },
    ],
  });

  // ── Perfiles (datos extra; el usuario vive en Neon Auth) ──
  await prisma.profile.create({
    data: {
      userId: 'neon-auth-user-organizer-001',
      rut: '12.345.678-9',
      isCompany: false,
      firstname: 'Camila',
      lastname: 'Rojas',
      role: 'organizer',
    },
  });
  await prisma.profile.create({
    data: {
      userId: 'neon-auth-user-admin-001',
      rut: '76.543.210-K',
      isCompany: true,
      firstname: 'Equipo',
      lastname: 'Konbini',
      role: 'admin',
    },
  });

  // ── Eventos (con componentes) ──
  await prisma.event.create({
    data: {
      title: 'Konbini Live Fest',
      company: 'Konbini Producciones',
      slug: 'konbini-live-fest',
      description: 'Festival de bandas indie y rock nacional.',
      about: 'Una jornada completa con más de diez bandas en dos escenarios.',
      expirationDate: new Date('2026-11-15'),
      address: 'Av. Matta',
      addressNumber: '890',
      ticketUrl: 'https://konbini.cl/tickets/konbini-live-fest',
      banner: 'https://placehold.co/1200x400/png',
      poster: 'https://placehold.co/600x900/png',
      gallery: ['https://placehold.co/800x600/png', 'https://placehold.co/800x600/png'],
      isApproved: true,
      isRejected: false,
      userId: 'neon-auth-user-organizer-001',
      approvedById: 'neon-auth-user-admin-001',
      regionId: region('region-metropolitana-de-santiago').id,
      communeId: commune('santiago').id,
      categories: { connect: [{ id: musica.id }] },
      prices: {
        create: [
          { name: 'Entrada general', price: 15000 },
          { name: 'Entrada VIP', price: 35000 },
        ],
      },
      dates: {
        create: [{ date: new Date('2026-11-14'), startTime: '18:00', endTime: '23:30' }],
      },
      socialLinks: { create: [{ link: 'https://instagram.com/konbinilivefest' }] },
      videos: { create: [{ link: 'https://youtube.com/watch?v=konbini-live' }] },
    },
  });

  await prisma.event.create({
    data: {
      title: 'Expo Anime Concepción',
      company: 'Otaku Sur SpA',
      slug: 'expo-anime-concepcion',
      description: 'Convención de anime, manga y videojuegos en el Biobío.',
      about: 'Concursos de cosplay, zona gamer y artistas invitados.',
      expirationDate: new Date('2026-10-20'),
      address: 'Barros Arana',
      addressNumber: '321',
      ticketUrl: 'https://konbini.cl/tickets/expo-anime-concepcion',
      banner: 'https://placehold.co/1200x400/png',
      gallery: [],
      isApproved: true,
      isRejected: false,
      userId: 'neon-auth-user-organizer-001',
      approvedById: 'neon-auth-user-admin-001',
      regionId: region('region-del-biobio').id,
      communeId: commune('concepcion').id,
      categories: { connect: [{ id: animeManga.id }, { id: videojuegos.id }] },
      prices: { create: [{ name: 'Entrada por día', price: 8000 }] },
      dates: {
        create: [
          { date: new Date('2026-10-18'), startTime: '10:00', endTime: '20:00' },
          { date: new Date('2026-10-19'), startTime: '10:00', endTime: '20:00' },
        ],
      },
      socialLinks: { create: [{ link: 'https://instagram.com/expoanimeccp' }] },
    },
  });

  await prisma.event.create({
    data: {
      title: 'Feria Gastronómica Providencia',
      company: 'Sabores Locales',
      slug: 'feria-gastronomica-providencia',
      description: 'Food trucks y cocina de autor al aire libre.',
      address: 'Av. Providencia',
      addressNumber: '2020',
      gallery: [],
      isApproved: false,
      isRejected: false,
      userId: 'neon-auth-user-organizer-001',
      regionId: region('region-metropolitana-de-santiago').id,
      communeId: commune('providencia').id,
      categories: { connect: [{ id: gastronomia.id }] },
      prices: { create: [{ name: 'Acceso liberado', price: 0 }] },
      dates: { create: [{ date: new Date('2026-12-06'), startTime: '12:00', endTime: '22:00' }] },
    },
  });

  // ── Conteo final ──
  const counts = {
    regions: await prisma.region.count(),
    communes: await prisma.commune.count(),
    categories: await prisma.category.count(),
    tags: await prisma.tag.count(),
    articles: await prisma.article.count(),
    heroes: await prisma.hero.count(),
    spots: await prisma.spot.count(),
    events: await prisma.event.count(),
    profiles: await prisma.profile.count(),
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
