// /seeders/cleanup.ts
// Seeder para limpiar todas las entradas creadas por los seeders anteriores

export default async ({ strapi }) => {
  console.log("🧹 Iniciando limpieza de la base de datos...");

  try {
    // Eliminar primero las entidades que dependen de otras (orden correcto)

    // 1. Eliminar todas las comunas (dependen de regiones)
    const deletedCommunes = await strapi.db.query('api::commune.commune').deleteMany({
      where: {}
    });
    console.log(`🗑️  Eliminadas ${deletedCommunes.count} comunas`);

    // 2. Eliminar todas las categorías
    const deletedCategories = await strapi.db.query('api::category.category').deleteMany({
      where: {}
    });
    console.log(`🗑️  Eliminadas ${deletedCategories.count} categorías`);

    // 3. Eliminar todos los tags
    const deletedTags = await strapi.db.query('api::tag.tag').deleteMany({
      where: {}
    });
    console.log(`🗑️  Eliminados ${deletedTags.count} tags`);

    // 4. Eliminar todas las regiones (después de comunas)
    const deletedRegions = await strapi.db.query('api::region.region').deleteMany({
      where: {}
    });
    console.log(`🗑️  Eliminadas ${deletedRegions.count} regiones`);

    console.log("✅ Limpieza completada exitosamente");
    console.log(`📊 Total de entradas eliminadas: ${deletedCategories.count + deletedRegions.count + deletedTags.count + deletedCommunes.count}`);

  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    throw error;
  }
};
