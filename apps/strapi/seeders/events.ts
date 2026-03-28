// /seeders/events.ts

import slugify from "slugify";

const eventsData = [
  {
    title: "Chile Comic Con 2026",
    company: "CCC Events",
    slug: slugify("Chile Comic Con 2026", { lower: true, strict: true }),
    description: "La convención de cómics, anime, manga y cultura pop más grande de Chile. Tres días de paneles, cosplay, artist alley y actividades para toda la familia.",
    about: "Chile Comic Con es el evento referente de la cultura geek en Sudamérica. Con más de 15 años de historia, reúne a miles de fanáticos para celebrar el anime, los cómics, los videojuegos y la cultura pop en general. Contaremos con invitados internacionales, torneos, concurso de cosplay y mucho más.",
    address: "Av. El Salto",
    address_number: "5000",
    expiration_date: "2026-08-20",
    ticket_url: "https://tickets.chilacomiccon.cl",
    is_approved: true,
    is_rejected: false,
    dates: [
      { date: "2026-08-21", start_time: "10:00", end_time: "21:00" },
      { date: "2026-08-22", start_time: "10:00", end_time: "21:00" },
      { date: "2026-08-23", start_time: "10:00", end_time: "20:00" },
    ],
    prices: [
      { name: "Entrada General", price: 15000 },
      { name: "Pase 3 Días", price: 35000 },
      { name: "VIP", price: 65000 },
    ],
    socialLinks: [
      { link: "https://instagram.com/chilecomiccon" },
      { link: "https://twitter.com/chilecomiccon" },
    ],
  },
  {
    title: "Anime Festival Santiago 2026",
    company: "AFS Producciones",
    slug: slugify("Anime Festival Santiago 2026", { lower: true, strict: true }),
    description: "El festival dedicado exclusivamente al anime y la cultura japonesa. Concursos de cosplay, proyecciones exclusivas, merchandise oficial y meet & greet con seiyuus.",
    about: "Anime Festival Santiago es el evento más importante dedicado exclusivamente al anime en Chile. Cada año sorprende con sorpresas de último minuto: anuncios de series, licencias nuevas y visitas especiales de artistas y seiyuus japoneses.",
    address: "Av. Beauchef",
    address_number: "850",
    expiration_date: "2026-05-10",
    ticket_url: "https://www.animefestivalsantiago.cl",
    is_approved: true,
    is_rejected: false,
    dates: [
      { date: "2026-05-16", start_time: "11:00", end_time: "20:00" },
      { date: "2026-05-17", start_time: "11:00", end_time: "20:00" },
    ],
    prices: [
      { name: "Entrada General Día", price: 12000 },
      { name: "Pase 2 Días", price: 20000 },
    ],
    socialLinks: [
      { link: "https://instagram.com/animefestivalsantiago" },
    ],
  },
  {
    title: "Torneo Nacional de Smash Bros Ultimate",
    company: "FGC Chile",
    slug: slugify("Torneo Nacional de Smash Bros Ultimate", { lower: true, strict: true }),
    description: "El torneo más grande de Super Smash Bros. Ultimate en Chile. Singles y doubles con premio en efectivo para los primeros 3 lugares. Clasificatorio para el campeonato latinoamericano.",
    about: "Organizado por la comunidad Fighting Game Community Chile, este torneo reúne a los mejores jugadores de Smash del país. El formato es eliminación doble con bracket suizo en grupos. El evento es apto para todos los niveles, con brackets de principiantes y un area de friendlies.",
    address: "General Bustamante",
    address_number: "25",
    expiration_date: "2026-04-20",
    ticket_url: "https://challonge.com/smashclnacional2026",
    is_approved: true,
    is_rejected: false,
    dates: [
      { date: "2026-04-25", start_time: "09:00", end_time: "22:00" },
      { date: "2026-04-26", start_time: "09:00", end_time: "20:00" },
    ],
    prices: [
      { name: "Inscripción Singles", price: 8000 },
      { name: "Inscripción Doubles (por equipo)", price: 12000 },
      { name: "Entrada Espectador", price: 3000 },
    ],
    socialLinks: [
      { link: "https://instagram.com/fgcchile" },
      { link: "https://discord.gg/fgcchile" },
    ],
  },
  {
    title: "Geek Night LAN Party Vol. 4",
    company: "Geek Night CL",
    slug: slugify("Geek Night LAN Party Vol 4", { lower: true, strict: true }),
    description: "24 horas de gaming non-stop en la LAN Party más grande del sur de Chile. Trae tu equipo, compite en torneos y comparte con la comunidad gamer.",
    about: "La Geek Night es el evento LAN Party más esperado del año. 500 puestos disponibles con red local de alta velocidad, torneos con premios, food trucks, música y mucho más. El evento es para mayores de 16 años. Se puede acampar en el recinto.",
    address: "Av. Colón",
    address_number: "1234",
    expiration_date: "2026-06-05",
    ticket_url: "https://geeknight.cl/tickets",
    is_approved: true,
    is_rejected: false,
    dates: [
      { date: "2026-06-06", start_time: "12:00", end_time: "12:00" },
    ],
    prices: [
      { name: "Entrada con puesto PC", price: 25000 },
      { name: "Entrada sin puesto (consolas propias)", price: 10000 },
    ],
    socialLinks: [
      { link: "https://instagram.com/geeknightcl" },
      { link: "https://twitch.tv/geeknightcl" },
    ],
  },
  {
    title: "Feria del Manga y el Cómic Valparaíso",
    company: "Valpo Manga",
    slug: slugify("Feria del Manga y el Comic Valparaiso", { lower: true, strict: true }),
    description: "La feria de compra, venta e intercambio de manga, cómics, figuras y coleccionables más importante de la región de Valparaíso.",
    about: "Más de 100 expositores con manga en español y japonés, cómics americanos y europeos, figuras, pins, posters y artesanías. Entrada libre, apto para todas las edades. Se realizan charlas de artistas locales y talleres de ilustración durante todo el día.",
    address: "Av. Brasil",
    address_number: "2950",
    expiration_date: "2026-07-12",
    ticket_url: "",
    is_approved: true,
    is_rejected: false,
    dates: [
      { date: "2026-07-18", start_time: "10:00", end_time: "19:00" },
      { date: "2026-07-19", start_time: "10:00", end_time: "18:00" },
    ],
    prices: [
      { name: "Entrada Libre", price: 0 },
    ],
    socialLinks: [
      { link: "https://instagram.com/valpomanga" },
    ],
  },
  {
    title: "eSports Summit Chile 2026",
    company: "ESL Chile",
    slug: slugify("eSports Summit Chile 2026", { lower: true, strict: true }),
    description: "El evento de deportes electrónicos más importante de Chile. Torneos de CS2, Valorant, LoL y FIFA con los mejores equipos profesionales del país y de Latinoamérica.",
    about: "eSports Summit Chile reúne a los equipos profesionales de los principales títulos competitivos. Además de los torneos principales, habrá pabellones de las marcas más importantes del hardware gamer, meet & greet con streamers y jugadores profesionales, y activaciones especiales.",
    address: "Av. Tupper",
    address_number: "2007",
    expiration_date: "2026-09-15",
    ticket_url: "https://esportssummit.cl",
    is_approved: true,
    is_rejected: false,
    dates: [
      { date: "2026-09-19", start_time: "10:00", end_time: "22:00" },
      { date: "2026-09-20", start_time: "10:00", end_time: "22:00" },
      { date: "2026-09-21", start_time: "10:00", end_time: "20:00" },
    ],
    prices: [
      { name: "Entrada General", price: 12000 },
      { name: "Pase 3 Días", price: 28000 },
      { name: "VIP con acceso a zona pro", price: 55000 },
    ],
    socialLinks: [
      { link: "https://instagram.com/eslchile" },
      { link: "https://twitter.com/eslchile" },
      { link: "https://twitch.tv/eslchile" },
    ],
  },
  {
    title: "Retro Gaming Fest Concepción",
    company: "Retro CL",
    slug: slugify("Retro Gaming Fest Concepcion", { lower: true, strict: true }),
    description: "Una celebración de los videojuegos clásicos de los 80, 90 y 2000. Exhibición de consolas retro, torneos de juegos clásicos y feria de coleccionables.",
    about: "El Retro Gaming Fest es un evento para nostálgicos y nuevos fans de los videojuegos clásicos. Podrás jugar en consolas originales como NES, SNES, Mega Drive, PlayStation 1 y 2, y Nintendo 64. Habrá torneos de Mario Kart 64, Street Fighter II y Tetris con premios para los ganadores.",
    address: "Av. O'Higgins",
    address_number: "740",
    expiration_date: "2026-04-10",
    ticket_url: "https://retrogamingfest.cl",
    is_approved: true,
    is_rejected: false,
    dates: [
      { date: "2026-04-11", start_time: "11:00", end_time: "20:00" },
      { date: "2026-04-12", start_time: "11:00", end_time: "19:00" },
    ],
    prices: [
      { name: "Entrada General", price: 5000 },
      { name: "Entrada Niños (5-12 años)", price: 2000 },
    ],
    socialLinks: [
      { link: "https://instagram.com/retrogamingcl" },
    ],
  },
  {
    title: "Cosplay Con Antofagasta",
    company: "Desierto Otaku",
    slug: slugify("Cosplay Con Antofagasta", { lower: true, strict: true }),
    description: "El primer evento dedicado exclusivamente al cosplay en el norte de Chile. Concurso con premios, talleres de confección y fotografía profesional gratuita para participantes.",
    about: "Cosplay Con Antofagasta nace de la necesidad de tener un espacio propio para la creciente comunidad cosplayer del norte grande. El concurso tiene categorías para principiantes, intermedios y avanzados, con jurado especializado y transmisión en vivo.",
    address: "Av. Argentina",
    address_number: "2300",
    expiration_date: "2026-05-25",
    ticket_url: "https://cosplayconantofagasta.cl",
    is_approved: true,
    is_rejected: false,
    dates: [
      { date: "2026-05-30", start_time: "10:00", end_time: "20:00" },
    ],
    prices: [
      { name: "Entrada General", price: 4000 },
      { name: "Inscripción Concurso", price: 0 },
    ],
    socialLinks: [
      { link: "https://instagram.com/cosplayconantofagasta" },
    ],
  },
  {
    title: "Pokémon Torneo Regional Santiago",
    company: "Pokémon Chile",
    slug: slugify("Pokemon Torneo Regional Santiago", { lower: true, strict: true }),
    description: "Torneo regional oficial del Juego de Cartas Coleccionable Pokémon con clasificatorio al torneo nacional. Divisiones Masters, Seniors e Infantil.",
    about: "El Torneo Regional de Santiago es un evento oficial de The Pokémon Company International. Los jugadores deben registrarse con su Pokémon Player ID. Se juega en formato Standard con las últimas rotaciones. Los primeros clasificados de cada división ganan puntos de campeonato para el mundial.",
    address: "Av. Apoquindo",
    address_number: "4501",
    expiration_date: "2026-06-20",
    ticket_url: "https://play.pokemon.com/es-es/torneos",
    is_approved: true,
    is_rejected: false,
    dates: [
      { date: "2026-06-28", start_time: "08:30", end_time: "20:00" },
    ],
    prices: [
      { name: "Inscripción Torneo", price: 6000 },
      { name: "Entrada Espectador", price: 0 },
    ],
    socialLinks: [
      { link: "https://instagram.com/pokemonchile" },
    ],
  },
  {
    title: "JRock & Anime Music Festival",
    company: "Sakura Events",
    slug: slugify("JRock y Anime Music Festival", { lower: true, strict: true }),
    description: "Una noche dedicada a la música japonesa con bandas de J-Rock, covers de openings de anime y actuaciones de artistas de música vocaloid en vivo.",
    about: "El JRock & Anime Music Festival reúne a las mejores bandas y artistas de música japonesa y anime de Chile. El evento incluye zona de food trucks con comida temática, feria de merchandise, photowall y activaciones. Es un evento para mayores de 14 años.",
    address: "Av. Italia",
    address_number: "1454",
    expiration_date: "2026-10-03",
    ticket_url: "https://sakuraevents.cl/jrock-festival",
    is_approved: true,
    is_rejected: false,
    dates: [
      { date: "2026-10-10", start_time: "18:00", end_time: "00:00" },
    ],
    prices: [
      { name: "Entrada Anticipada", price: 10000 },
      { name: "Entrada General", price: 14000 },
    ],
    socialLinks: [
      { link: "https://instagram.com/sakuraevents_cl" },
      { link: "https://twitter.com/sakuraclevents" },
    ],
  },
];

export default async (strapi) => {
  console.log("🎪 Seeding events...");

  for (const eventData of eventsData) {
    const existing = await strapi.entityService.findMany("api::event.event", {
      filters: { slug: eventData.slug },
    });

    if (existing.length === 0) {
      await strapi.entityService.create("api::event.event", {
        data: eventData,
      });
      console.log(`  ✅ Evento creado: ${eventData.title}`);
    } else {
      console.log(`  ⏭️  Evento ya existe: ${eventData.title}`);
    }
  }

  console.log("🎪 Events seeded successfully");
};
