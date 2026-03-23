<template>
  <div class="card card--dates">
    <div class="card--dates__header">
      <Calendar class="card--dates__icon" />
      <span class="card--dates__title">Fecha y hora</span>
    </div>
    <div class="card--dates__content">
      <div v-for="date in dates" :key="date.id" class="card--dates__item">
        <span class="card--dates__date">{{ formatDate(date.date) }}</span>
        <span class="card--dates__time">Desde {{ formatTime(date.start_time) }} hs</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar } from 'lucide-vue-next'

interface Date {
  id: number
  date: string
  start_time: string
  end_time: string
}

interface Props {
  dates?: Date[]
}

const props = defineProps<Props>()

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-')
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ]
  return `${day} de ${months[parseInt(month) - 1]} ${year}`
}

const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':')
  return `${hours}:${minutes}`
}
</script>
