// import type { Core } from '@strapi/strapi';

import populateCategories from "../seeders/categories";
import populateRegions from "../seeders/regions";
import populateTags from "../seeders/tags";
import populateEvents from "../seeders/events";
import populateArticles from "../seeders/articles";
import populateHeroes from "../seeders/heroes";
import populateSpots from "../seeders/spots";
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
    const runSeeders = process.env.APP_RUN_SEEDERS === "true";
    const runCleanup = process.env.APP_CLEANUP_SEEDERS === "true";

    if (!runSeeders) {
      console.log("⏭️ Seeders deshabilitados (APP_RUN_SEEDERS=false)");
      return;
    }

    console.log("🌱 Ejecutando seeders...");

    try {
      if (runCleanup) {
        await cleanup({ strapi });
        console.log("🧹 Cleanup completado exitosamente");
      }

      // Ejecutar seeders en orden
      await populateRegions(strapi);
      console.log("🗺️ Regiones pobladas exitosamente");

      await populateCategories(strapi);
      console.log("📂 Categorías pobladas exitosamente");

      await populateTags(strapi);
      console.log("🏷️ Tags poblados exitosamente");

      await populateEvents(strapi);
      console.log("Events seeded successfully");

      await populateArticles(strapi);
      console.log("Articles seeded successfully");

      await populateHeroes(strapi);
      console.log("Heroes seeded successfully");

      await populateSpots(strapi);
      console.log("Spots seeded successfully");

      console.log("🎉 Todos los seeders completados exitosamente");
    } catch (error) {
      console.error("❌ Error ejecutando seeders:", error);
    }
  },
};
