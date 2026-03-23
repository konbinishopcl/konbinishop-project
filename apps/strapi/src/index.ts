// import type { Core } from '@strapi/strapi';

import populateCategories from "../seeders/categories";
import populateRegions from "../seeders/regions";
import populateTags from "../seeders/tags";
import cleanup from "../seeders/cleanup";

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { Core.Strapi } */) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    // Verificar si los seeders están habilitados
    const runSeeders = process.env.APP_RUN_SEEDERS === "true";

    if (!runSeeders) {
      console.log("⏭️ Seeders deshabilitados (APP_RUN_SEEDERS=false)");
      return;
    }

    console.log("🌱 Ejecutando seeders...");

    try {
      // Ejecutar cleanup primero para limpiar datos existentes
      await cleanup({ strapi });
      console.log("🧹 Cleanup completado exitosamente");

      // Ejecutar seeders en orden
      await populateRegions(strapi);
      console.log("🗺️ Regiones pobladas exitosamente");

      await populateCategories(strapi);
      console.log("📂 Categorías pobladas exitosamente");

      await populateTags(strapi);
      console.log("🏷️ Tags poblados exitosamente");

      console.log("🎉 Todos los seeders completados exitosamente");
    } catch (error) {
      console.error("❌ Error ejecutando seeders:", error);
    }
  },
};
