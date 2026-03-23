export default ({ env }) => ({
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
    },
  },
  sentry: {
    enabled: true,
    config: {
      dsn: "https://bed8a202a44c1bf2e3971b962c5be740@o4509929700196352.ingest.us.sentry.io/4509930249519104",
      sendMetadata: true,
      init: {
        debug: env('NODE_ENV') === 'development',
        environment: env('NODE_ENV', 'development'),
        tracesSampleRate: 1.0,
        enableTracing: true,
        attachStacktrace: true,
        release: env('STRAPI_VERSION', '1.0.0'),

        // NUEVO: Habilitar captura de logs
        logLevel: 'log', // Captura log, warn, error
        enableLogging: true,

        beforeSend(event) {
          event.tags = event.tags || {};
          event.tags.environment = env('NODE_ENV', 'development');
          event.tags.deployment = env('DEPLOYMENT_ENV', 'unknown');
          event.tags.strapi_version = env('STRAPI_VERSION', 'unknown');

          // NUEVO: Marcar logs de autenticación
          if (event.level === 'warning' || event.level === 'info') {
            event.tags.log_type = 'authentication';
          }

          return event;
        },

        // NUEVO: Configurar breadcrumbs para mejor trazabilidad
        beforeBreadcrumb(breadcrumb) {
          // Filtrar breadcrumbs innecesarios
          if (breadcrumb.category === 'console') {
            return null;
          }
          return breadcrumb;
        },
      },
    },
  },
});
