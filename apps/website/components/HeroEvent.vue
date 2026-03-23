<template>
  <section v-if="hasBanner" class="hero hero--event">
    <div class="hero--event__bg">
      <NuxtImg :src="bannerUrl" :alt="title" />
    </div>
    <div class="hero--event__content">
      <div v-if="hasPoster" class="hero--event__content__poster">
        <ImagePoster :image-url="posterUrl" :alt="title" />
      </div>
      <div class="hero--event__content__text">
        <h1 class="hero--event__content__title">{{ title }}</h1>
        <div v-if="categories && categories.length" class="hero--event__content__badges">
          <BadgeEvent
            v-for="category in categories"
            :key="category.id"
            :text="category.name"
            :slug="category.slug"
          />
        </div>
      </div>
      <div v-if="prices && prices.length" class="hero--event__content__right">
        <CardPurchase :prices="prices" :ticket-url="ticketUrl" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useImageUrl } from '@/composables/useImageUrl'
import ImagePoster from '@/components/ImagePoster.vue'
import BadgeEvent from '@/components/BadgeEvent.vue'
import CardPurchase from '@/components/CardPurchase.vue'

interface Category {
  id: number
  name: string
  slug: string
  description?: string
}

interface Price {
  id: number
  name: string
  price: number
}

interface Props {
  title?: string
  banner?: {
    url?: string
  } | null
  poster?: {
    url?: string
  } | null
  categories?: Category[]
  prices?: Price[]
  ticketUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Eventos',
  banner: null,
  poster: null,
  categories: () => [],
  prices: () => [],
  ticketUrl: '',
})

const { getImageUrl } = useImageUrl()

const bannerUrl = computed(() => {
  return getImageUrl(props.banner?.url)
})

const posterUrl = computed(() => {
  return getImageUrl(props.poster?.url)
})

const hasBanner = computed(() => {
  return !!(bannerUrl.value && bannerUrl.value.trim() !== '')
})

const hasPoster = computed(() => {
  return !!(posterUrl.value && posterUrl.value.trim() !== '')
})
</script>
