export default (config, { strapi }) => {
  return async (ctx, next) => {
    await next();

    strapi.log.info('🔐 Auth failure details: ' + JSON.stringify(ctx.response, null, 2));

    // Solo capturar errores de autenticación
    if (ctx.path === '/api/auth/local' && ctx.method === 'POST' && ctx.response.status >= 400) {

      // Información esencial para debuggear
      const debugInfo = {
        email: ctx.request.body?.identifier || 'no email',
        password: ctx.request.body?.password ? '***' : 'no password',
        status: ctx.response.status,
        error: ctx.response.body?.error?.message || 'unknown error',
        timestamp: new Date().toISOString(),
        ip: ctx.request.ip
      };

      // Enviar a Sentry de forma simple
      try {
        const sentryService = strapi.plugin('sentry').service('sentry');
        const authError = new Error(`Login failed for: ${debugInfo.email}`);

        sentryService.sendError(authError, (scope) => {
          scope.setTag('auth_failure', 'true');
          scope.setTag('email', debugInfo.email);
          scope.setContext('login_attempt', debugInfo);
        });

        strapi.log.info('🔐 Auth failure details: ' + JSON.stringify(debugInfo, null, 2));

      } catch (sentryError) {
        strapi.log.error('❌ Sentry error:', sentryError.message);
      }
    }
  };
};
