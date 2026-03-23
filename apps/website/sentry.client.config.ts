import * as Sentry from '@sentry/nuxt'

const config = useRuntimeConfig()

Sentry.init({
  dsn: config.public.sentry.dsn,
  environment: config.public.sentry.environment,

  // Configuración de performance
  tracesSampleRate: config.public.sentry.tracesSampleRate,

  // Configuración de Session Replay
  replaysSessionSampleRate: config.public.sentry.replaysSessionSampleRate,
  replaysOnErrorSampleRate: config.public.sentry.replaysOnErrorSampleRate,

  // Integraciones
  integrations: [
    Sentry.replayIntegration({
      // Configuración adicional para Session Replay
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Habilitar logs
  enableLogs: true,

  // Debug mode solo en desarrollo
  // debug: config.public.sentry.environment === 'development',

  // Configuración adicional para mejor tracking
  beforeSend(event) {
    // Agregar información adicional del contexto
    if (event.user) {
      event.tags = {
        ...event.tags,
        user_authenticated: 'true',
        user_id: event.user.id,
      }
    }

    return event
  },

  // Configuración de breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Filtrar breadcrumbs sensibles
    if (breadcrumb.category === 'console' && breadcrumb.level === 'error') {
      return null
    }
    return breadcrumb
  },
})
