/**
 * Seed de konbini-nest-api.
 * Idempotente: limpia todas las tablas y vuelve a poblar con datos de ejemplo.
 * Regiones y comunas: las 16 regiones de Chile completas (igual que el seeder de Strapi).
 * Ejecutar: yarn prisma:seed
 */
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

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
  await prisma.article.deleteMany();
  await prisma.hero.deleteMany();
  await prisma.spot.deleteMany();
  await prisma.commune.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.region.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

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
        userId: organizer.id,
      },
      {
        title: 'Sonido e iluminación — llámanos',
        linkType: 'PHONE',
        linkValue: '+56912345678',
        expirationDate: new Date('2026-11-30'),
        userId: organizer.id,
      },
      {
        title: 'Cotiza tu stand para convenciones',
        image: 'https://placehold.co/600x300/png',
        linkType: 'EMAIL',
        linkValue: 'ventas@example.cl',
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
        image: '/uploads/hero-1.jpg',
        date: new Date('2026-09-21'),
        place: "Parque O'Higgins, Santiago",
        link: 'https://example.cl/festival-de-primavera',
        categoryId: musica.id,
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
        image: '/uploads/hero-2.jpg',
        date: new Date('2026-10-12'),
        place: 'Centro de Convenciones, Viña del Mar',
        link: 'https://example.cl/expo-otaku-vina',
        categoryId: animeManga.id,
        userId: organizer.id,
        status: 'APPROVED',
        days: 30,
        amount: 30 * 15000,
        expirationDate: new Date('2026-10-13'),
      },
    ],
  });

  // ── Eventos (con componentes) ──
  // Imágenes alojadas en la API: apps/api/uploads/poster-N.jpg y banner-N.jpg,
  // servidas en /uploads/. El campo del evento guarda la ruta relativa.
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
    regionSlug: string;
    communeSlug: string;
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
      cats: ['musica'], regionSlug: 'region-metropolitana-de-santiago', communeSlug: 'santiago',
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
      cats: ['anime', 'videojuegos'], regionSlug: 'region-del-biobio', communeSlug: 'concepcion',
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
      cats: ['musica'], regionSlug: 'region-metropolitana-de-santiago', communeSlug: 'providencia',
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
      cats: ['anime'], regionSlug: 'valparaiso', communeSlug: 'valparaiso',
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
      cats: ['videojuegos'], regionSlug: 'region-metropolitana-de-santiago', communeSlug: 'las-condes',
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
      cats: ['musica', 'teatro'], regionSlug: 'region-metropolitana-de-santiago', communeSlug: 'santiago',
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
      cats: ['teatro'], regionSlug: 'valparaiso', communeSlug: 'vina-del-mar',
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
      cats: ['anime'], regionSlug: 'antofagasta', communeSlug: 'antofagasta',
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
      cats: ['videojuegos'], regionSlug: 'region-metropolitana-de-santiago', communeSlug: 'nunoa',
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
      cats: ['gastronomia', 'anime'], regionSlug: 'region-metropolitana-de-santiago', communeSlug: 'santiago',
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
      cats: ['teatro'], regionSlug: 'coquimbo', communeSlug: 'la-serena',
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
      cats: ['anime'], regionSlug: 'region-de-la-araucania', communeSlug: 'temuco',
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
        banner: `/uploads/banner-${ev.img}.jpg`,
        poster: `/uploads/poster-${ev.img}.jpg`,
        gallery: [`/uploads/poster-${ev.img}.jpg`, `/uploads/banner-${ev.img}.jpg`],
        status: ev.approved ? 'APPROVED' : 'PENDING_MODERATION',
        userId: organizer.id,
        approvedById: ev.approved ? admin.id : null,
        regionId: region(ev.regionSlug).id,
        communeId: commune(ev.communeSlug).id,
        categoryId: catId[ev.cats[0]] ?? null,
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
