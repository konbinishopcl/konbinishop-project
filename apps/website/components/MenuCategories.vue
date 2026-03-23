<template>
  <!-- <nuxt-link to="/">Inicio</nuxt-link> -->
  <div class="menu menu--categories">
    <!-- Solo el símbolo + -->
    <div
      class="menu--categories__dropdown"
      @mouseenter="showDropdown = true"
      @mouseleave="showDropdown = false"
    >
      <button class="menu--categories__dropdown__trigger">
        <Plus />
      </button>

      <div v-show="showDropdown" class="menu--categories__dropdown__content">
        <nuxt-link
          v-for="category in remainingCategories"
          :key="category.id"
          :to="`/${category.slug}`"
          :class="{ 'router-link-active': isActiveRoute(category.slug) }"
          class="menu--categories__dropdown__item"
        >
          <Tag class="menu--categories__dropdown__item__icon" />
          <span class="menu--categories__dropdown__item__text">{{ category.name }} </span>
          <span class="menu--categories__dropdown__item__count"
            >({{ category.eventsCount || 0 }})</span
          >
        </nuxt-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCategoryStore } from '@/stores/category.store'
import { Plus, Tag } from 'lucide-vue-next'

const { logout } = useStrapiAuth()
const router = useRouter()
const route = useRoute()
const categoryStore = useCategoryStore()
const showDropdown = ref(false)

// Cargar categorías antes del renderizado
const { data: categoriesData } = await useAsyncData('categories', async () => {
  await categoryStore.fetchCategories()
  return categoryStore.categories
})

// Todas las categorías para el dropdown
const allCategories = computed(() => {
  return categoriesData.value || categoryStore.categories || []
})

// Las categorías restantes para el dropdown (excluyendo las primeras 6)
const remainingCategories = computed(() => {
  const allCategories = categoriesData.value || categoryStore.categories || []
  return allCategories.slice(6) // Solo las que están después de las primeras 6
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
