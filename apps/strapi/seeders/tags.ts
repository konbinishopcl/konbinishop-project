// /seeders/tags.ts

const tagsData = [
  // Videojuegos - Los más populares
  { name: "Videojuegos", slug: "videojuegos" },
  { name: "Gaming", slug: "gaming" },
  { name: "eSports", slug: "esports" },
  { name: "PC Gaming", slug: "pc-gaming" },
  { name: "Nintendo", slug: "nintendo" },
  { name: "PlayStation", slug: "playstation" },
  { name: "Xbox", slug: "xbox" },
  { name: "Mobile Gaming", slug: "mobile-gaming" },
  { name: "Retro Gaming", slug: "retro-gaming" },
  { name: "Indie Games", slug: "indie-games" },
  { name: "RPG", slug: "rpg" },
  { name: "FPS", slug: "fps" },
  { name: "MOBA", slug: "moba" },
  { name: "Battle Royale", slug: "battle-royale" },
  { name: "Streaming", slug: "streaming" },
  { name: "Twitch", slug: "twitch" },

  // Anime y Manga - Los más populares
  { name: "Anime", slug: "anime" },
  { name: "Manga", slug: "manga" },
  { name: "Cosplay", slug: "cosplay" },
  { name: "Otaku", slug: "otaku" },
  { name: "Shonen", slug: "shonen" },
  { name: "Shojo", slug: "shojo" },
  { name: "Seinen", slug: "seinen" },
  { name: "Mecha", slug: "mecha" },
  { name: "Fantasy", slug: "fantasy" },
  { name: "Action", slug: "action" },
  { name: "Comedy", slug: "comedy" },
  { name: "Romance", slug: "romance" },
  { name: "Adventure", slug: "adventure" },
  { name: "Supernatural", slug: "supernatural" },
  { name: "Isekai", slug: "isekai" },

  // Eventos y Convenciones - Los más importantes
  { name: "Convenciones", slug: "convenciones" },
  { name: "Comic Con", slug: "comic-con" },
  { name: "Anime Con", slug: "anime-con" },
  { name: "Gaming Con", slug: "gaming-con" },
  { name: "Exposiciones", slug: "exposiciones" },
  { name: "Lanzamientos", slug: "lanzamientos" },
  { name: "Torneos", slug: "torneos" },
  { name: "Cosplay Contest", slug: "cosplay-contest" },

  // Tecnología y Entretenimiento - Los más relevantes
  { name: "Realidad Virtual", slug: "realidad-virtual" },
  { name: "Realidad Aumentada", slug: "realidad-aumentada" },
  { name: "Desarrollo de Juegos", slug: "desarrollo-de-juegos" },
  { name: "Arte Digital", slug: "arte-digital" },
  { name: "Animación", slug: "animacion" },

  // Cultura Pop y Entretenimiento - Los más populares
  { name: "Cultura Pop", slug: "cultura-pop" },
  { name: "Memes", slug: "memes" },
  { name: "Viral", slug: "viral" },
  { name: "Redes Sociales", slug: "redes-sociales" },
  { name: "Influencers", slug: "influencers" },
  { name: "Content Creators", slug: "content-creators" },
  { name: "Podcasts", slug: "podcasts" },
  { name: "Reviews", slug: "reviews" },
  { name: "Guías", slug: "guias" },
  { name: "Tutoriales", slug: "tutoriales" },

  // Géneros de Juegos - Los más populares
  { name: "Aventura", slug: "aventura" },
  { name: "Estrategia", slug: "estrategia" },
  { name: "Simulación", slug: "simulacion" },
  { name: "Deportes", slug: "deportes" },
  { name: "Carreras", slug: "carreras" },
  { name: "Lucha", slug: "lucha" },
  { name: "Plataformas", slug: "plataformas" },
  { name: "Puzzle", slug: "puzzle" },
  { name: "Multijugador", slug: "multijugador" },
  { name: "Online", slug: "online" },
  { name: "Cloud Gaming", slug: "cloud-gaming" }
];

const populateTags = async (strapi: any) => {
  console.log("🏷️  Populando tags...");

  console.log(`Procesando ${tagsData.length} tags...`);

  for (const tag of tagsData) {
    try {
      // Verificar si el tag ya existe
      const existingTag = await strapi.entityService.findMany("api::tag.tag", {
        filters: { slug: tag.slug },
      });

      if (existingTag.length > 0) {
        console.log(`Tag ya existe: ${tag.name}`);
        continue;
      }

      // Crear el tag usando strapi.entityService para que se publique automáticamente
      await strapi.entityService.create("api::tag.tag", {
        data: {
          name: tag.name,
          slug: tag.slug,
        },
      });

      console.log(`✅ Tag creado: ${tag.name}`);
    } catch (tagError) {
      console.error(
        `❌ Error creando tag ${tag.name}:`,
        tagError.message
      );
    }
  }

  console.log("🎯 Tags populados exitosamente");
};

// Esta función será llamada desde el bootstrap de src/index.ts

export default populateTags;
