<template>
  <section class="events events--archive">
    <div class="events--archive__container">
      <div v-if="events.length > 0" class="events--archive__grid">
        <CardEvent v-for="event in events" :key="event.slug" :event="event" />
      </div>

      <EmptyEvents v-else />

      <!-- Paginación -->
      <div v-if="pagination.totalPages > 1" class="events--archive__pagination">
        <button
          class="pagination__button"
          :disabled="pagination.currentPage <= 1"
          @click="$emit('page-change', pagination.currentPage - 1)"
        >
          Anterior
        </button>

        <span class="pagination__info">
          Página {{ pagination.currentPage }} de {{ pagination.totalPages }}
        </span>

        <button
          class="pagination__button"
          :disabled="pagination.currentPage >= pagination.totalPages"
          @click="$emit('page-change', pagination.currentPage + 1)"
        >
          Siguiente
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import CardEvent from '@/components/CardEvent.vue'
import EmptyEvents from '@/components/EmptyEvents.vue'
import type { Event } from '@/types/event.types'

interface Props {
  events: Event[]
  pagination: {
    currentPage: number
    totalPages: number
    totalEvents: number
  }
}

defineProps<Props>()
defineEmits<{
  'page-change': [page: number]
}>()
</script>
