export default (config, { strapi }) => {
  return async (ctx, next) => {
    await next();

    // Solo modificar respuestas de autenticación y evitar durante el bootstrap
    if (ctx.path === '/api/auth/local' && ctx.method === 'POST' && ctx.response.body?.user) {
      try {
        const userId = ctx.response.body.user.id;

        // Obtener el usuario completo con el rol
        const userWithRole = await strapi.query('plugin::users-permissions.user').findOne({
          where: { id: userId },
          populate: {
            role: true,
          },
        });

        // Reemplazar la respuesta del usuario con la que incluye el rol
        if (userWithRole) {
          ctx.response.body.user = {
            ...ctx.response.body.user,
            role: userWithRole.role,
          };
        }
      } catch (error) {
        // Log del error pero no fallar la aplicación
        console.warn('⚠️ Error en middleware auth-response:', error.message);
      }
    }
  };
};
