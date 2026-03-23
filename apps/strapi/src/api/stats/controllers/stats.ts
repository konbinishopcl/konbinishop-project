/**
 * stats controller
 */

export default {
  async find(ctx) {
    try {
      // Get counts for all entities
      const [categoryCount, communeCount, regionCount, tagCount] = await Promise.all([
        strapi.entityService.count("api::category.category"),
        strapi.entityService.count("api::commune.commune"),
        strapi.entityService.count("api::region.region"),
        strapi.entityService.count("api::tag.tag")
      ]);

      // Get article specific counts (published vs draft)
      const [articlePublishedCount, articleDraftCount] = await Promise.all([
        strapi.entityService.count("api::article.article", { filters: { publishedAt: { $notNull: true } } }),
        strapi.entityService.count("api::article.article", { filters: { publishedAt: { $null: true } } })
      ]);

      // Get article total count
      const articleCount = await strapi.entityService.count("api::article.article");

      // Get user counts (active, pending, blocked)
      const [userActiveCount, userPendingCount, userBlockedCount] = await Promise.all([
        strapi.entityService.count("plugin::users-permissions.user", { filters: { confirmed: true, blocked: false } }),
        strapi.entityService.count("plugin::users-permissions.user", { filters: { confirmed: false, blocked: false } }),
        strapi.entityService.count("plugin::users-permissions.user", { filters: { blocked: true } })
      ]);

      // Get user total count
      const userCount = await strapi.entityService.count("plugin::users-permissions.user");

      // Get event counts by status
      const currentDate = new Date();
      const [eventRejectedCount, eventPendingCount, eventArchivedCount, eventActiveCount] = await Promise.all([
        strapi.entityService.count("api::event.event", { filters: { is_rejected: true } }),
        strapi.entityService.count("api::event.event", { filters: { is_approved: false, is_rejected: false } }),
        strapi.entityService.count("api::event.event", { filters: { is_approved: true, is_rejected: false, expiration_date: { $lt: currentDate } } }),
        strapi.entityService.count("api::event.event", { filters: { is_approved: true, is_rejected: false, expiration_date: { $gt: currentDate } } })
      ]);

      // Get event total count
      const eventCount = await strapi.entityService.count("api::event.event");

      // Get hero counts by status
      const [heroActiveCount, heroArchivedCount] = await Promise.all([
        strapi.entityService.count("api::hero.hero", { filters: { expiration_date: { $gte: currentDate } } }),
        strapi.entityService.count("api::hero.hero", { filters: { expiration_date: { $lt: currentDate } } })
      ]);

      // Get hero total count
      const heroCount = await strapi.entityService.count("api::hero.hero");

      // Get spot counts by status
      const [spotActiveCount, spotArchivedCount] = await Promise.all([
        strapi.entityService.count("api::spot.spot", { filters: { expiration_date: { $gte: currentDate } } }),
        strapi.entityService.count("api::spot.spot", { filters: { expiration_date: { $lt: currentDate } } })
      ]);

      // Get spot total count
      const spotCount = await strapi.entityService.count("api::spot.spot");

      const stats = {
        article: {
          total: articleCount,
          published: articlePublishedCount,
          draft: articleDraftCount
        },
        user: {
          total: userCount,
          active: userActiveCount,
          pending: userPendingCount,
          blocked: userBlockedCount
        },
        event: {
          total: eventCount,
          rejected: eventRejectedCount,
          pending: eventPendingCount,
          archived: eventArchivedCount,
          active: eventActiveCount
        },
        hero: {
          total: heroCount,
          active: heroActiveCount,
          archived: heroArchivedCount
        },
        spot: {
          total: spotCount,
          active: spotActiveCount,
          archived: spotArchivedCount
        },
        category: categoryCount,
        commune: communeCount,
        region: regionCount,
        tag: tagCount
      };

      return { data: stats };
    } catch (error) {
      console.error("Error getting stats:", error);
      return ctx.internalServerError("Error retrieving statistics");
    }
  }
};
