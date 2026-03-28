// /seeders/cleanup.ts
// Seeder para limpiar todas las entradas creadas por los seeders anteriores

export default async ({ strapi }) => {
  console.log("🧹 Iniciando limpieza de la base de datos...");

  try {
    // Eliminar primero las entidades que dependen de otras (orden correcto)

    // 1. Eliminar todos los eventos
    const deletedEvents = await strapi.db.query('api::event.event').deleteMany({
      where: {}
    });
    console.log(`🗑️  Eliminados ${deletedEvents.count} eventos`);

    // 2. Eliminar todos los artículos (pueden referenciar tags/events)
    const deletedArticles = await strapi.db.query('api::article.article').deleteMany({
      where: {}
    });
    console.log(`🗑️  Eliminados ${deletedArticles.count} artículos`);

    // 2. Eliminar todos los heroes (pueden referenciar regiones/comunas/categorías)
    const deletedHeroes = await strapi.db.query('api::hero.hero').deleteMany({
      where: {}
    });
    console.log(`🗑️  Eliminados ${deletedHeroes.count} heroes`);

    // 3. Eliminar todos los spots
    const deletedSpots = await strapi.db.query('api::spot.spot').deleteMany({
      where: {}
    });
    console.log(`🗑️  Eliminados ${deletedSpots.count} spots`);

    // 4. Eliminar todas las comunas (dependen de regiones)
    const deletedCommunes = await strapi.db.query('api::commune.commune').deleteMany({
      where: {}
    });
    console.log(`🗑️  Eliminadas ${deletedCommunes.count} comunas`);

    // 5. Eliminar todas las categorías
    const deletedCategories = await strapi.db.query('api::category.category').deleteMany({
      where: {}
    });
    console.log(`🗑️  Eliminadas ${deletedCategories.count} categorías`);

    // 6. Eliminar todos los tags
    const deletedTags = await strapi.db.query('api::tag.tag').deleteMany({
      where: {}
    });
    console.log(`🗑️  Eliminados ${deletedTags.count} tags`);

    // 7. Eliminar todas las regiones (después de comunas)
    const deletedRegions = await strapi.db.query('api::region.region').deleteMany({
      where: {}
    });
    console.log(`🗑️  Eliminadas ${deletedRegions.count} regiones`);

    console.log("✅ Limpieza completada exitosamente");
    console.log(`📊 Total de entradas eliminadas: ${deletedEvents.count + deletedArticles.count + deletedHeroes.count + deletedSpots.count + deletedCommunes.count + deletedCategories.count + deletedTags.count + deletedRegions.count}`);

  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    throw error;
  }
};
