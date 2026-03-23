<template>
  <div class="empty empty--events">
    <div class="empty--events__image">
      <div class="empty--events__icon">
        <CalendarX :size="40" />
      </div>
    </div>
    <div class="empty--events__body">
      <h3 class="empty--events__body__title">{{ title }}</h3>
      <div class="empty--events__body__description">
        <p>{{ description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalendarX } from 'lucide-vue-next'

interface Props {
  title?: string
  description?: string
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'No se encontraron eventos',
  description:
    'No hay eventos disponibles en este momento. Intenta con otros filtros o vuelve más tarde.',
  icon: 'lucide:calendar-x',
})
</script>
