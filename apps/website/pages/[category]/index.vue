<template>
  <div class="page page--category">
    <HeroCategory
      v-if="category"
      :title="category.name"
      :description="`Descubre todos los eventos de ${category.name}`"
      :image="category.banner?.url || '/images/hero.png'"
    />
    <EventsCategory
      v-if="category"
      :events="events"
      :pages="pages"
      :current-page="currentPage"
      @page-change="goToPage"
    />
  </div>
</template>

<script setup lang="ts">
import EventsCategory from '@/components/EventsCategory.vue'
import HeroCategory from '@/components/HeroCategory.vue'
import type { Category, Event } from '@/types/event.types'

const route = useRoute()
const currentPage = ref(1)
const totalPages = ref(1)
const eventsPerPage = 24

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Obtener la categoría actual
const { data: category } = useAsyncData(`category-${route.params.category}`, async () => {
  try {
    const client = useStrapiClient()
    const response = await client<{ data: Category[] }>('categories', {
      params: {
        'filters[slug][$eq]': route.params.category,
        populate: '*',
      },
    })
    return response.data?.[0] || null
  } catch (error) {
    console.error('Error al cargar categoría:', error)
    return null
  }
})

// Obtener eventos de la categoría
const { data: eventsData } = useAsyncData(
  `events-${route.params.category}-page-${currentPage.value}`,
  async () => {
    if (!category.value) return null

    try {
      const client = useStrapiClient()
      const response = await client<{
        data: Event[]
        meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } }
      }>('events', {
        params: {
          'filters[categories][id][$eq]': category.value.id,
          'pagination[page]': currentPage.value,
          'pagination[pageSize]': eventsPerPage,
          sort: 'createdAt:desc',
          populate: {
            categories: true,
            commune: true,
            region: true,
            banner: true,
            poster: true,
            gallery: true,
            prices: true,
            dates: true,
            socialLinks: true,
            videos: true,
          },
        },
      })

      if (response.meta?.pagination) {
        totalPages.value = response.meta.pagination.pageCount
      }

      return response.data || []
    } catch (error) {
      console.error('Error al cargar eventos:', error)
      return []
    }
  },
  {
    watch: [currentPage, category],
  }
)

const events = computed(() => eventsData.value || [])

// Crear array de páginas
const pages = computed(() => {
  const pagesArray = []
  for (let i = 1; i <= totalPages.value; i++) {
    pagesArray.push(i)
  }
  return pagesArray
})
</script>
