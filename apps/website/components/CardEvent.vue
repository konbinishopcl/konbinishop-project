<template>
  <article class="card card--default" itemscope itemtype="http://schema.org/Event">
    <!-- <pre>{{ event.slug }}</pre> -->
    <NuxtLink
      class="card--default__image"
      :to="`/eventos/${event.slug}`"
      aria-label="Imagen del evento: {{ event.title }}"
    >
      <NuxtImg
        :src="posterImage"
        :alt="event.title"
        itemprop="image"
        width="230"
        height="330"
        loading="lazy"
      />
    </NuxtLink>
    <NuxtLink :to="`/eventos/${event.slug}`" class="card--default__body">
      <h3 class="card--default__body__title" itemprop="name">{{ event.title }}</h3>
      <p class="card--default__body__details">
        <time v-if="formattedDate.date" :datetime="formattedDate.date" itemprop="startDate">
          <Calendar class="card--default__body__details__icon" />
          {{ formattedDate.hasMultipleDates ? `Desde ${formattedDate.date}` : formattedDate.date }}
        </time>
        <span v-if="location" itemprop="location" itemscope itemtype="http://schema.org/Place">
          <MapPin class="card--default__body__details__icon" />
          <span itemprop="name">{{ location }}</span>
        </span>
      </p>
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
import { defineProps, withDefaults, computed } from 'vue'
import { useEvents } from '@/composables/useEvents'
import type { Event } from '@/types/event.types'
import { Calendar, MapPin } from 'lucide-vue-next'

const { getEarliestDate, getLocation, getPosterImage } = useEvents()

const props = withDefaults(
  defineProps<{
    event?: Event
  }>(),
  {
    event: () => ({}) as Event,
  }
)

const formattedDate = computed(() => {
  return getEarliestDate(props.event.dates)
})

const location = computed(() => {
  return getLocation(props.event)
})

const posterImage = computed(() => {
  return getPosterImage(props.event)
})
</script>
