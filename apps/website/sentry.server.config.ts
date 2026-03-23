import * as Sentry from '@sentry/nuxt'

const config = useRuntimeConfig()

Sentry.init({
  dsn: config.public.sentry.dsn,
  environment: config.public.sentry.environment,

  // Configuración de performance
  tracesSampleRate: config.public.sentry.tracesSampleRate,

  // Habilitar logs
  enableLogs: true,

  // Debug mode solo en desarrollo
  // debug: config.public.sentry.environment === 'development',

  // Configuración adicional para mejor tracking del servidor
  beforeSend(event) {
    // Agregar información del servidor
    event.tags = {
      ...event.tags,
      environment: 'server',
      node_version: process.version,
    }

    return event
  },

  // Configuración de breadcrumbs para el servidor
  beforeBreadcrumb(breadcrumb) {
    // Filtrar breadcrumbs sensibles del servidor
    if (breadcrumb.data && breadcrumb.data.url) {
      // Ocultar información sensible de URLs
      const url = new URL(breadcrumb.data.url)
      if (url.searchParams.has('token') || url.searchParams.has('password')) {
        url.searchParams.set('token', '[REDACTED]')
        url.searchParams.set('password', '[REDACTED]')
        breadcrumb.data.url = url.toString()
      }
    }

    return breadcrumb
  },
})
