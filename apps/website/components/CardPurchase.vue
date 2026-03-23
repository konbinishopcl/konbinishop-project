<template>
  <div class="card card--purchase">
    <div class="card--purchase__header">
      <Ticket class="card--purchase__icon" />
      <span class="card--purchase__title">Tickets</span>
    </div>
    <div class="card--purchase__info">
      <span class="card--purchase__text">Entradas disponibles en Cinepolis.cl</span>
    </div>
    <a
      v-if="ticketUrl"
      :href="ticketUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="card--purchase__button"
    >
      Comprar desde ${{ minPrice?.toLocaleString() }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Ticket } from 'lucide-vue-next'

interface Price {
  id: number
  name: string
  price: number
}

interface Props {
  prices: Price[]
  ticketUrl?: string
}

const props = defineProps<Props>()

const minPrice = computed(() => {
  if (!props.prices || props.prices.length === 0) return 0
  return Math.min(...props.prices.map(price => price.price))
})
</script>
