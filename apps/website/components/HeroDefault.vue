<template>
  <!-- <pre>{{ heroes.data }}</pre> -->
  <section class="hero hero--default">
    <div class="hero--default__bg">
      <div class="hero--default__bg__carousel">
        <CarouselBackground :items="heroes || []" :current-index="currentSlide" />
      </div>
    </div>
    <div class="hero--default__content">
      <CarouselHero
        :items="heroes || []"
        :auto-play="heroes && heroes.length > 1"
        :show-controls="heroes && heroes.length > 1"
        @slide-change="handleSlideChange"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useHeroStore } from '@/stores/hero.store'
import type { Hero } from '@/types/hero.types'
import CarouselBackground from '@/components/CarouselBackground.vue'
import CarouselHero from '@/components/CarouselHero.vue'

const heroStore = useHeroStore()
const currentSlide = ref(0)

const { data: heroes } = await useAsyncData('heroes', async () => {
  const response = await heroStore.fetchHeroes()
  return response?.data || []
})

const handleSlideChange = (index: number) => {
  currentSlide.value = index
}
</script>
