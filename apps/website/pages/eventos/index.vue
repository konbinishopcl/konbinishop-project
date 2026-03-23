<template>
  <div class="page page--events">
    <HeroArchive
      title="Eventos"
      description="Descubre una amplia variedad de eventos culturales, artísticos y de entretenimiento. Desde exposiciones y conciertos hasta talleres y festivales, encuentra tu próxima experiencia inolvidable."
      image="/images/hero.png"
    />
    <EventsArchive :events="events" :pagination="pagination" @page-change="goToPage" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

import EventsArchive from '@/components/EventsArchive.vue'
import HeroArchive from '@/components/HeroArchive.vue'
import type { Event } from '@/types/event.types'

const currentPage = ref(1)
const eventsPerPage = 24
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalEvents: 0,
})

const goToPage = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    currentPage.value = page
  }
}

// Cargar eventos
const { data: eventsData } = useAsyncData(
  `events-page-${currentPage.value}`,
  async () => {
    try {
      const client = useStrapiClient()
      const response = await client<{
        data: Event[]
        meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } }
      }>('events', {
        params: {
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
        pagination.value = {
          currentPage: currentPage.value,
          totalPages: response.meta.pagination.pageCount,
          totalEvents: response.meta.pagination.total,
        }
      }

      return response.data || []
    } catch (error) {
      console.error('Error al cargar eventos:', error)
      return []
    }
  },
  {
    watch: [currentPage],
  }
)

const events = computed(() => eventsData.value || [])
</script>
