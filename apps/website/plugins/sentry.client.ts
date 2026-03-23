import { watch } from 'vue'
import * as Sentry from '@sentry/nuxt'

export default defineNuxtPlugin(() => {
  // Solo ejecutar en el cliente
  if (import.meta.client) {
    const user = useStrapiUser()
    const { setUser, addBreadcrumb } = useSentry()

    // Observar cambios en el usuario y actualizar Sentry
    watch(
      user,
      newUser => {
        setUser(newUser)
      },
      { immediate: true }
    )

    // Configurar breadcrumbs para navegación
    const router = useRouter()
    router.beforeEach((to, from) => {
      addBreadcrumb({
        category: 'navigation',
        message: `Navegando de ${from.path} a ${to.path}`,
        level: 'info',
        data: {
          from: from.path,
          to: to.path,
          timestamp: new Date().toISOString(),
        },
      })
    })
  }
})
