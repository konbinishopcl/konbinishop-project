<template>
  <section class="events events--default">
    <div
      v-for="category in categoriesWithEvents"
      :key="category.id"
      class="events--default__container"
    >
      <div class="events--default__header">
        <h2 class="events--default__title">
          <NuxtLink :to="`/${category.slug}`">
            <Tag class="events--default__title__icon" />
            <span>{{ category.name }}</span>
            <ChevronRight />
          </NuxtLink>
        </h2>
        <NuxtLink :to="`/${category.slug}`" class="events--default__link">Ver todos</NuxtLink>
      </div>
      <div class="events--default__grid">
        <template v-for="event in category.events" :key="event.id">
          <CardEvent :event="event" />
        </template>
        <CardEmpty v-for="n in 6 - (category.events?.length || 0)" :key="`empty-${n}`" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import CardEvent from '@/components/CardEvent.vue'
import CardEmpty from '@/components/CardEmpty.vue'
import EmptyEvents from '@/components/EmptyEvents.vue'
import { ChevronRight, Tag } from 'lucide-vue-next'
import type { Category, Event } from '@/types/event.types'

interface CategoryWithEvents extends Category {
  events: Event[]
}

const { data: categoriesResponse } = useAsyncData('categories-with-events', async () => {
  try {
    const client = useStrapiClient()

    // Obtener categorías
    const categoriesResponse = await client<{ data: Category[] }>('categories', {
      params: {
        populate: '*',
      },
    })

    // Para cada categoría, traer los últimos 6 eventos
    const categoriesWithEvents = await Promise.all(
      categoriesResponse.data.map(async (category: Category) => {
        try {
          const eventsResponse = await client<{ data: Event[] }>('events', {
            params: {
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
              filters: {
                categories: {
                  id: {
                    $eq: category.id,
                  },
                },
              },
              sort: 'createdAt:desc',
              'pagination[pageSize]': 6,
            },
          })

          return {
            ...category,
            events: eventsResponse.data || [],
          }
        } catch (error) {
          console.error(`Error al cargar eventos para categoría ${category.name}:`, error)
          return {
            ...category,
            events: [],
          }
        }
      })
    )

    return categoriesWithEvents
  } catch (error) {
    console.error('Error al cargar categorías y eventos:', error)
    return []
  }
})

const categoriesWithEvents = computed(() => {
  if (!categoriesResponse.value) return []

  return categoriesResponse.value
    .filter(category => category.events && category.events.length > 0)
    .sort((a, b) => {
      // Ordenar por cantidad de eventos (descendente)
      if (b.events.length !== a.events.length) {
        return b.events.length - a.events.length
      }
      // Si tienen la misma cantidad, ordenar alfabéticamente
      return a.name.localeCompare(b.name)
    })
})
</script>
