<template>
  <div class="carousel">
    <div class="carousel__container">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="carousel__item"
        :class="{ 'carousel__item--active': currentIndex === index }"
      >
        <template v-if="item.desktop_image?.url">
          <NuxtImg
            :src="getMedia(item.desktop_image.url)"
            :alt="item.desktop_image.alternativeText || item.title"
            class="carousel__item__desktop"
          />
        </template>
        <template v-if="item.tablet_image?.url">
          <NuxtImg
            :src="getMedia(item.tablet_image.url)"
            :alt="item.tablet_image.alternativeText || item.title"
            class="carousel__item__tablet"
          />
        </template>
        <template v-if="item.mobile_image?.url">
          <NuxtImg
            :src="getMedia(item.mobile_image.url)"
            :alt="item.mobile_image.alternativeText || item.title"
            class="carousel__item__mobile"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { Hero } from '@/types/hero.types'

import { useImageUrl } from '../composables/useImageUrl'

const props = defineProps<{
  items: Hero[]
  currentIndex?: number
}>()

const { getImageUrl } = useImageUrl()
const getMedia = (url: string | undefined) => getImageUrl(url)

const currentIndex = ref(props.currentIndex || 0)

watch(
  () => props.currentIndex,
  newIndex => {
    if (newIndex !== undefined) {
      currentIndex.value = newIndex
    }
  }
)
</script>

<style lang="scss">
.carousel {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &__container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  &__item {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    pointer-events: none;
    filter: blur(20px);
    transform: scale(1.1);
    transition:
      opacity 0.4s ease,
      filter 0.4s ease,
      transform 0.4s ease;

    &--active {
      opacity: 1;
      pointer-events: auto;
      filter: blur(0);
      transform: scale(1);
    }

    img {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
    }

    &__desktop {
      @media (max-width: $breakpoint-md) {
        display: none;
      }
    }

    &__tablet {
      display: none;
      @media (max-width: $breakpoint-md) {
        display: block;
      }
      @media (max-width: $breakpoint-sm) {
        display: none;
      }
    }

    &__mobile {
      display: none;
      @media (max-width: $breakpoint-sm) {
        display: block;
      }
    }
  }
}
</style>
