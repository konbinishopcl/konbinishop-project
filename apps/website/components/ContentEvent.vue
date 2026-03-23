<template>
  <div class="content content--event">
    <div class="content--event__container">
      <div class="content--event__main">
        <div class="content--event__description">
          <div class="paragraph" v-html="description"></div>
        </div>
        <div class="content--event__videos">
          <GalleryVideos v-if="videos && videos.length" :videos="videos" />
        </div>
        <div class="content--event__gallery">
          <GalleryDefault
            v-if="gallery && gallery.length"
            :images="galleryImages"
            :banner-url="bannerUrl"
            :poster-url="posterUrl"
          />
        </div>
      </div>
      <div class="content--event__sidebar">
        <CardAbout :description="truncatedDescription" />
        <CardDates :dates="dates" />
        <CardMap
          :location-name="locationName"
          :address="address"
          :address-number="addressNumber"
          :commune="commune"
          :region="region"
        />
        <CardLinks :social-links="socialLinks" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CardAbout from '@/components/CardAbout.vue'
import CardDates from '@/components/CardDates.vue'
import CardMap from '@/components/CardMap.vue'
import CardLinks from '@/components/CardLinks.vue'
import GalleryDefault from '@/components/GalleryDefault.vue'
import GalleryVideos from '@/components/GalleryVideos.vue'
import { useImageUrl } from '@/composables/useImageUrl'

interface Date {
  id: number
  date: string
  start_time: string
  end_time: string
}

interface Commune {
  name: string
  slug: string
}

interface Region {
  name: string
  slug: string
}

interface SocialLink {
  id: number
  link: string
}

interface GalleryImage {
  id: number
  url: string
  alternativeText?: string
  name: string
}

interface Video {
  id: number
  link: string
}

interface Props {
  description?: string
  gallery?: GalleryImage[]
  videos?: Video[]
  dates?: Date[]
  locationName?: string
  address?: string
  addressNumber?: string
  commune?: Commune
  region?: Region
  socialLinks?: SocialLink[]
  bannerUrl?: string
  posterUrl?: string
}

const props = defineProps<Props>()
const { getImageUrl } = useImageUrl()

const truncatedDescription = computed(() => {
  if (!props.description) return ''
  // Remove HTML tags and truncate to 150 characters
  const textOnly = props.description.replace(/<[^>]*>/g, '')
  return textOnly.length > 150 ? textOnly.substring(0, 150) + '...' : textOnly
})

const galleryImages = computed(() => {
  if (!props.gallery) return []

  return props.gallery.map(image => ({
    url: getImageUrl(image.url),
    alt: image.alternativeText || image.name,
  }))
})
</script>
