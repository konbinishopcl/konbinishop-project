// /seeders/heroes.ts

import slugify from "slugify";

const heroesData = [
  {
    title: "Chile Comic Con 2026 — El evento más grande del año",
    date: "2026-07-18",
    address: "Av. El Salto",
    address_number: "5000",
    venue: "Espacio Riesco",
    link: "https://www.chilecomiccon.cl",
    expiration_date: "2026-07-20",
  },
  {
    title: "Anime Festival Santiago — Verano Otaku 2026",
    date: "2026-08-09",
    address: "Av. Beauchef",
    address_number: "850",
    venue: "Club Hípico de Santiago",
    link: "https://www.animefestival.cl",
    expiration_date: "2026-08-11",
  },
  {
    title: "Geek Night LAN Party — 24 Horas de Gaming",
    date: "2026-09-13",
    address: "Av. Parque Antonio Rabat",
    address_number: "6165",
    venue: "Espacio El Trovador",
    link: "https://www.geeknightchile.cl",
    expiration_date: "2026-09-14",
  },
  {
    title: "Gaming Expo Chile — Lo mejor de la industria",
    date: "2026-10-03",
    address: "Av. Kennedy",
    address_number: "7400",
    venue: "Centro Cultural Casapiedra",
    link: "https://www.gamingexpochile.cl",
    expiration_date: "2026-10-05",
  },
  {
    title: "Cosplay Battle Festival — Compite por el título nacional",
    date: "2026-11-21",
    address: "Av. Matucana",
    address_number: "501",
    venue: "Museo de Arte Contemporáneo",
    link: "https://www.cosplaybattle.cl",
    expiration_date: "2026-11-22",
  },
];

const populateHeroes = async (strapi: any) => {
  console.log("Poblando heroes...");

  console.log(`Procesando ${heroesData.length} heroes...`);

  for (const hero of heroesData) {
    try {
      const heroSlug = slugify(hero.title, { lower: true, strict: true });

      // Verificar si el hero ya existe
      const existingHero = await strapi.entityService.findMany("api::hero.hero", {
        filters: { slug: heroSlug },
      });

      if (existingHero.length > 0) {
        console.log(`Hero ya existe: ${hero.title}`);
        continue;
      }

      // Crear el hero usando strapi.entityService para que se publique automáticamente
      await strapi.entityService.create("api::hero.hero", {
        data: {
          title: hero.title,
          slug: heroSlug,
          date: hero.date,
          address: hero.address,
          address_number: hero.address_number,
          venue: hero.venue,
          link: hero.link,
          expiration_date: hero.expiration_date,
        },
      });

      console.log(`✅ Hero creado: ${hero.title}`);
    } catch (heroError) {
      console.error(
        `❌ Error creando hero ${hero.title}:`,
        heroError.message
      );
    }
  }

  console.log("🎉 Datos de heroes poblados exitosamente");
};

// Esta función será llamada desde el bootstrap de src/index.ts

export default populateHeroes;
