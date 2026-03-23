<template>
  <!-- Aquí puedes agregar tu template si es necesario -->
  <div class="page page--provider">
    <LoadingDefault />
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { useAppStore } from '@/stores/app.store'
import LoadingDefault from '@/components/LoadingDefault.vue'

// Obtener la función authenticateProvider de useStrapiAuth
const { authenticateProvider } = useStrapiAuth()
// Obtener la ruta y el router
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const authenticate = async () => {
  try {
    // Autenticar al usuario con Google utilizando el token de acceso de la URL
    const response = await authenticateProvider('google', String(route.query.access_token || ''))
    // Redirigir a /anuncios si la autenticación es exitosa
    if (response) {
      // Obtener el referer del store o usar /anuncios como fallback
      const redirectTo = appStore.getReferer || '/'
      // Limpiar el referer después de usarlo
      appStore.clearReferer()

      router.push(redirectTo)
    }
  } catch (error) {
    // Mostrar el mensaje de error y redirigir a /login
    const errorMessage =
      error.response?.data?.error?.details?.error?.message ||
      'Error desconocido durante la autenticación.'
    Swal.fire('Error', errorMessage, 'error')
    router.push('/login')
  }
}

// Llamar a la función de autenticación cuando el componente se monta
authenticate()
</script>
