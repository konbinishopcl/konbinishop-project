<template>
  <section class="single single--event">
    <div class="single--event__container">
      <div class="single--event__body">
        <pre>Event data: {{ JSON.stringify(eventData, null, 2) }}</pre>
      </div>
      <div class="single--event__sidebar">
        <pre>Event data: {{ JSON.stringify(eventData, null, 2) }}</pre>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useEventStore } from '@/stores/event.store'
import { useRoute } from 'vue-router'

const route = useRoute()
const eventStore = useEventStore()

const { data: eventData } = await useAsyncData('event', async () => {
  const event = await eventStore.getEventBySlug(route.params.slug as string)
  return event
})
</script>
