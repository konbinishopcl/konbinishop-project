<template>
  <section class="events events--default">
    <div v-if="events.length > 0" class="events--default__container">
      <div class="events--default__grid">
        <template v-for="event in events" :key="event.slug">
          <CardEvent :event="event" />
        </template>
      </div>

      <!-- Paginación -->
      <div v-if="pages.length > 1" class="events--default__pagination">
        <button
          class="pagination__button"
          :disabled="currentPage <= 1"
          @click="$emit('page-change', currentPage - 1)"
        >
          Anterior
        </button>

        <span class="pagination__info"> Página {{ currentPage }} de {{ pages.length }} </span>

        <button
          class="pagination__button"
          :disabled="currentPage >= pages.length"
          @click="$emit('page-change', currentPage + 1)"
        >
          Siguiente
        </button>
      </div>
    </div>

    <EmptyEvents v-else />
  </section>
</template>

<script setup lang="ts">
import CardEvent from '@/components/CardEvent.vue'
import EmptyEvents from '@/components/EmptyEvents.vue'
import type { Category, Event } from '@/types/event.types'

interface Props {
  events: Event[]
  pages: number[]
  currentPage: number
}

defineProps<Props>()
defineEmits<{
  'page-change': [page: number]
}>()
</script>
