/**
 * stats router
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/stats',
      handler: 'stats.find',
      config: {
        auth: false,
        policies: [],
        middlewares: []
      }
    }
  ]
};
