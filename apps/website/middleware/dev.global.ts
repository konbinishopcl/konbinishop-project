export default defineNuxtRouteMiddleware(to => {
  // Solo ejecutar en el cliente
  if (typeof window === 'undefined') return

  // Verificar si estamos en modo desarrollo
  const config = useRuntimeConfig()
  const devMode = config.public.devMode
  const devCookie = useCookie('devmode')

  if (!devMode) return

  // Verificar si ya está autenticado (tiene token válido)
  if (to.path === '/dev' && devCookie.value) {
    return navigateTo('/')
  }

  // Función para detectar bots/motores de búsqueda
  const isBot = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    const botPatterns = [
      'googlebot',
      'bingbot',
      'slurp',
      'duckduckbot',
      'baiduspider',
      'yandexbot',
      'facebookexternalhit',
      'twitterbot',
      'rogerbot',
      'linkedinbot',
      'embedly',
      'quora link preview',
      'showyoubot',
      'outbrain',
      'pinterest',
      'slackbot',
      'vkShare',
      'W3C_Validator',
      'crawler',
      'spider',
      'bot',
      'scraper',
    ]

    return botPatterns.some(pattern => userAgent.includes(pattern))
  }

  // Permitir acceso a bots/motores de búsqueda
  console.log('🔍 isBot():', isBot())
  if (isBot()) return

  // Verificar si tiene token de sesión válido
  console.log('🔍 Cookie devCookie:', devCookie.value)
  if (devCookie.value) return

  // Si no está autenticado y no está en la página de login de desarrollo, redirigir
  if (to.path !== '/dev') {
    console.log('❌ Usuario no autenticado, redirigiendo a /dev desde:', to.path)
    window.location.href = '/dev'
    return
  }
})
