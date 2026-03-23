<template>
  <div class="page page--event">
    <HeroEvent
      v-if="eventData"
      :title="eventData?.title"
      :banner="eventData?.banner"
      :poster="eventData?.poster"
      :categories="eventData?.categories"
      :prices="eventData?.prices"
      :ticket-url="eventData?.ticket_url"
    />
    <ContentEvent
      :description="eventData?.description"
      :gallery="eventData?.gallery"
      :videos="eventData?.videos"
      :dates="eventData?.dates"
      :location-name="eventData?.company"
      :address="eventData?.address"
      :address-number="eventData?.address_number"
      :commune="eventData?.commune"
      :region="eventData?.region"
      :social-links="eventData?.socialLinks"
      :banner-url="eventData?.banner?.url"
      :poster-url="eventData?.poster?.url"
    />
    <!-- <SingleEvent v-if="eventData" :event="eventData" /> -->
  </div>
</template>

<script setup lang="ts">
import SingleEvent from '@/components/SingleEvent.vue'
import HeroEvent from '@/components/HeroEvent.vue'
import ContentEvent from '@/components/ContentEvent.vue'
import GalleryDefault from '@/components/GalleryDefault.vue'
import type { Event } from '@/types/event.types'

const route = useRoute()
const eventSlug = route.params.slug as string

const { data: eventData } = useLazyAsyncData('event', async () => {
  try {
    const client = useStrapiClient()

    const eventResponse = await client<{ data: Event[] }>('events', {
      params: {
        'filters[slug][$eq]': eventSlug,
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

    return eventResponse.data?.[0] || null
  } catch (error) {
    console.error('Error al cargar evento:', error)
    return null
  }
})
</script>
