declare global {
  interface Window {
    dataLayer: unknown[]
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const gtmId = config.public.gtmId || process.env.GTM_ID || 'GTM-XXXXXXXX'

  // Solo ejecutar en el cliente
  if (import.meta.client) {
    // Script de GTM para el head
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`
    document.head.appendChild(script)

    // Inicializar dataLayer
    window.dataLayer = window.dataLayer || []
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args)
    }
    gtag('js', new Date())
    gtag('config', gtmId)
  }
})
