import * as Sentry from '@sentry/nuxt'

export default defineNuxtPlugin(() => {
  // Solo ejecutar en el servidor
  if (import.meta.server) {
    // Configurar contexto del servidor
    Sentry.setTag('environment', 'server')

    // Middleware para capturar información del usuario en requests
    addRouteMiddleware('sentry-user-context', (to, from) => {
      try {
        const user = useStrapiUser()

        if (user.value) {
          Sentry.setUser({
            id: user.value.id.toString(),
            email: user.value.email,
            username: user.value.username,
            firstname: user.value.firstname,
            lastname: user.value.lastname,
          })

          Sentry.setTag('user_type', 'authenticated')
          Sentry.setTag('provider', user.value.provider || 'local')
        } else {
          Sentry.setUser(null)
          Sentry.setTag('user_type', 'anonymous')
        }

        // Agregar breadcrumb para la ruta
        Sentry.addBreadcrumb({
          category: 'navigation',
          message: `Accediendo a ${to.path}`,
          level: 'info',
          data: {
            path: to.path,
            timestamp: new Date().toISOString(),
          },
        })
      } catch (error) {
        // Si hay error al obtener el usuario, no fallar
        console.warn('Error configurando Sentry user context:', error)
      }
    })
  }
})
