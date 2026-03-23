import * as Sentry from '@sentry/nuxt'

export function useSentry() {
  // Función para capturar errores
  const captureException = (error: Error, context?: Record<string, unknown>) => {
    if (context) {
      Sentry.setContext('error_context', context)
    }
    Sentry.captureException(error)
  }

  // Función para capturar mensajes
  const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
    Sentry.captureMessage(message, level)
  }

  // Función para agregar breadcrumbs
  const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
    Sentry.addBreadcrumb(breadcrumb)
  }

  // Función para configurar el usuario
  const setUser = (
    user: {
      id: string | number
      email?: string
      username?: string
      firstname?: string
      lastname?: string
    } | null
  ) => {
    if (user) {
      Sentry.setUser({
        id: user.id.toString(),
        email: user.email,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
      })

      // Agregar tags útiles
      Sentry.setTag('user_type', 'authenticated')
      Sentry.setTag('user_id', user.id.toString())

      if (user.email) {
        Sentry.setTag('user_email', user.email)
      }
    } else {
      Sentry.setUser(null)
      Sentry.setTag('user_type', 'anonymous')
      // Limpiar tags específicos
      Sentry.setTag('user_id', '')
      Sentry.setTag('user_email', '')
    }
  }

  // Función para configurar tags
  const setTag = (key: string, value: string) => {
    Sentry.setTag(key, value)
  }

  // Función para configurar contexto
  const setContext = (name: string, context: Record<string, unknown>) => {
    Sentry.setContext(name, context)
  }

  return {
    captureException,
    captureMessage,
    addBreadcrumb,
    setUser,
    setTag,
    setContext,
  }
}
