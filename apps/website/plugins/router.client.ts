export default defineNuxtPlugin(() => {
  const router = useRouter()

  // Rutas que no queremos guardar como referer
  const excludedRoutes = ['/registro', '/404', '/recuperar-contrasena', '/restablecer-contrasena']

  router.beforeEach((to, from) => {
    const appStore = useAppStore()
    // Solo guardamos el referer si la ruta anterior no está en la lista de excluidas
    // y no es una ruta de /cuenta
    if (
      !excludedRoutes.includes(from.fullPath) &&
      !from.fullPath.startsWith('/cuenta') &&
      !from.fullPath.startsWith('/login')
    ) {
      appStore.setReferer(from.fullPath)
    }
  })
})
