<template>
  <div class="gallery gallery--default">
    <!-- Banner image -->
    <div v-if="bannerUrl" class="gallery--default__item" @click="openLightbox(0)">
      <NuxtImg :src="getImageUrl(bannerUrl)" alt="Event banner" class="gallery--default__image" />
    </div>

    <!-- Poster image -->
    <div v-if="posterUrl" class="gallery--default__item" @click="openLightbox(bannerUrl ? 1 : 0)">
      <NuxtImg :src="getImageUrl(posterUrl)" alt="Event poster" class="gallery--default__image" />
    </div>

    <!-- Gallery images -->
    <div
      v-for="(image, index) in images"
      :key="index"
      class="gallery--default__item"
      @click="openLightbox(getGalleryImageIndex(index))"
    >
      <NuxtImg
        :src="image.url"
        :alt="image.alt || `Gallery image ${index + 1}`"
        class="gallery--default__image"
      />
    </div>
  </div>

  <VueEasyLightbox
    :visible="visible"
    :imgs="lightboxImages"
    :index="index"
    @hide="visible = false"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import VueEasyLightbox from 'vue-easy-lightbox'
import { useImageUrl } from '@/composables/useImageUrl'

interface Image {
  url: string
  alt?: string
}

interface Props {
  images: Image[]
  bannerUrl?: string
  posterUrl?: string
}

const props = defineProps<Props>()
const { getImageUrl } = useImageUrl()

const visible = ref(false)
const index = ref(0)

const lightboxImages = computed(() => {
  const allImages = []

  if (props.bannerUrl) {
    allImages.push(getImageUrl(props.bannerUrl))
  }

  if (props.posterUrl) {
    allImages.push(getImageUrl(props.posterUrl))
  }

  allImages.push(...props.images.map(img => img.url))

  return allImages
})

const getGalleryImageIndex = (galleryIndex: number) => {
  let offset = 0
  if (props.bannerUrl) offset++
  if (props.posterUrl) offset++
  return offset + galleryIndex
}

const openLightbox = (imgIndex: number) => {
  index.value = imgIndex
  visible.value = true
}
</script>
