// /seeders/spots.ts

const spotsData = [
  {
    title: "Banner Chile Comic Con 2026",
    link: "https://www.chilecomiccon.cl/tickets",
    expiration_date: "2026-07-20",
  },
  {
    title: "Promoción Gaming Gear Chile",
    link: "https://www.gaminggearchile.cl/ofertas",
    expiration_date: "2026-06-30",
  },
  {
    title: "Anime Store — Figuras y Merchandise",
    link: "https://www.animestore.cl",
    expiration_date: "2026-08-31",
  },
  {
    title: "Inscripciones Torneo Nacional FGC",
    link: "https://www.fgcchile.cl/torneo",
    expiration_date: "2026-07-01",
  },
  {
    title: "Descuentos Feria del Libro Geek",
    link: "https://www.ferialibro.cl/geek",
    expiration_date: "2026-09-15",
  },
];

const populateSpots = async (strapi: any) => {
  console.log("Poblando spots...");

  console.log(`Procesando ${spotsData.length} spots...`);

  for (const spot of spotsData) {
    try {
      // Verificar si el spot ya existe
      const existingSpot = await strapi.entityService.findMany("api::spot.spot", {
        filters: { title: spot.title },
      });

      if (existingSpot.length > 0) {
        console.log(`Spot ya existe: ${spot.title}`);
        continue;
      }

      // Crear el spot usando strapi.entityService para que se publique automáticamente
      await strapi.entityService.create("api::spot.spot", {
        data: {
          title: spot.title,
          link: spot.link,
          expiration_date: spot.expiration_date,
        },
      });

      console.log(`✅ Spot creado: ${spot.title}`);
    } catch (spotError) {
      console.error(
        `❌ Error creando spot ${spot.title}:`,
        spotError.message
      );
    }
  }

  console.log("🎉 Datos de spots poblados exitosamente");
};

// Esta función será llamada desde el bootstrap de src/index.ts

export default populateSpots;
