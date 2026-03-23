// /seeders/categories.ts

const categoriesData = [
  {
    name: "Anime Convention",
    slug: "anime-convention",
    description: "Convenciones dedicadas al anime, manga y cultura japonesa con cosplay, artistas y actividades temáticas.",
  },
  {
    name: "Artist Alley",
    slug: "artist-alley",
    description: "Área donde artistas independientes venden y exhiben sus obras de arte, ilustraciones y productos creativos.",
  },
  {
    name: "Board Game Night",
    slug: "board-game-night",
    description: "Noches dedicadas a juegos de mesa, estrategia y entretenimiento social con tableros y cartas.",
  },
  {
    name: "Comic Con",
    slug: "comic-con",
    description: "Convenciones de cómics, superhéroes, ciencia ficción y cultura pop con celebridades y actividades.",
  },
  {
    name: "Convención",
    slug: "convencion",
    description: "Eventos masivos que reúnen aficionados, profesionales y empresas en torno a un tema o industria.",
  },
  {
    name: "Cosplay Contest",
    slug: "cosplay-contest",
    description: "Competencias donde participantes se disfrazan de personajes de anime, videojuegos, películas o cómics.",
  },
  {
    name: "Esports Event",
    slug: "esports-event",
    description: "Competencias profesionales de videojuegos con premios, transmisiones en vivo y audiencias masivas.",
  },
  {
    name: "Fan Meetup",
    slug: "fan-meetup",
    description: "Reuniones informales de fanáticos para compartir pasiones, discutir teorías y crear comunidad.",
  },
  {
    name: "Gaming Convention",
    slug: "gaming-convention",
    description: "Convenciones centradas en videojuegos con lanzamientos, demos, torneos y experiencias inmersivas.",
  },
  {
    name: "Gaming Expo",
    slug: "gaming-expo",
    description: "Exposiciones de la industria de videojuegos con las últimas tecnologías, juegos y tendencias.",
  },
  {
    name: "Gaming Tournament",
    slug: "gaming-tournament",
    description: "Competencias de videojuegos con brackets, eliminatorias y premios para jugadores de todos los niveles.",
  },
  {
    name: "LAN Party",
    slug: "lan-party",
    description: "Reuniones de jugadores para competir en videojuegos multijugador en red local con equipos personales.",
  },
  {
    name: "Manga Reading",
    slug: "manga-reading",
    description: "Sesiones de lectura grupal de manga japonés con discusiones sobre tramas, personajes y arte.",
  },
  {
    name: "Retro Gaming",
    slug: "retro-gaming",
    description: "Eventos dedicados a videojuegos clásicos y consolas retro con nostalgia y competiciones vintage.",
  },
  {
    name: "Tabletop RPG",
    slug: "tabletop-rpg",
    description: "Sesiones de juegos de rol de mesa con narrativas inmersivas, dados y creatividad colaborativa.",
  },
  {
    name: "Voice Actor Meet",
    slug: "voice-actor-meet",
    description: "Encuentros con actores de doblaje para conocer sus trabajos y participar en actividades temáticas.",
  },
];

const populateCategories = async (strapi: any) => {
  console.log("Poblando categorías...");

  console.log(`Procesando ${categoriesData.length} categorías...`);

  for (const category of categoriesData) {
    try {
      // Verificar si la categoría ya existe
      const existingCategory = await strapi.entityService.findMany("api::category.category", {
        filters: { slug: category.slug },
      });

      if (existingCategory.length > 0) {
        console.log(`Categoría ya existe: ${category.name}`);
        continue;
      }

      // Crear la categoría usando strapi.entityService para que se publique automáticamente
      await strapi.entityService.create("api::category.category", {
        data: {
          name: category.name,
          slug: category.slug,
          description: category.description,
        },
      });

      console.log(`✅ Categoría creada: ${category.name}`);
    } catch (categoryError) {
      console.error(
        `❌ Error creando categoría ${category.name}:`,
        categoryError.message
      );
    }
  }

  console.log("🎉 Datos de categorías poblados exitosamente");
};

// Esta función será llamada desde el bootstrap de src/index.ts

export default populateCategories;
