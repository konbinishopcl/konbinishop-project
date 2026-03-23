<template>
  <!-- <nuxt-link to="/">Inicio</nuxt-link> -->
  <div class="menu menu--default">
    <template v-for="category in categories" :key="category.id">
      <nuxt-link
        :to="`/${category.slug}`"
        class="menu--default__link"
        :class="{ 'router-link-active': isActiveRoute(category.slug) }"
      >
        {{ category.name }}
      </nuxt-link>
    </template>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useCategoryStore } from '@/stores/category.store'

const { logout } = useStrapiAuth()
const router = useRouter()
const route = useRoute()
const categoryStore = useCategoryStore()

// Cargar categorías antes del renderizado
const { data: categoriesData } = await useAsyncData('categories', async () => {
  await categoryStore.fetchCategories()
  return categoryStore.categories
})

const categories = computed(() => {
  const allCategories = categoriesData.value || categoryStore.categories
  // Las categorías ya vienen ordenadas por cantidad de eventos del store
  // Solo tomamos las primeras 6 (las más populares)
  return allCategories ? allCategories.slice(0, 6) : []
})

const isActiveRoute = slug => {
  return route.path.startsWith(`/${slug}`)
}

const handleLogout = async () => {
  try {
    await logout()
    router.push('/login')
  } catch (error) {
    console.error('Error al cerrar sesión', error)
  }
}
</script>
