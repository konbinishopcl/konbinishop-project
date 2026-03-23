<template>
  <div ref="carouselRef" class="carousel" @mouseenter="stopAutoPlay" @mouseleave="startAutoPlay">
    <div class="carousel__content">
      <div
        v-for="(slide, index) in items"
        v-show="currentSlide === index"
        :key="index"
        class="carousel__slide"
      >
        <div class="carousel__slidecontent">
          <h2>{{ slide.title }}</h2>
          <p>{{ slide.venue }}</p>
          <NuxtLink :to="slide.link" class="button button--default"> Learn More </NuxtLink>
        </div>
      </div>
    </div>

    <button
      v-if="showControls"
      class="carousel__navbutton carousel__navbutton--prev"
      @click="prevSlide"
    >
      <IconChevronLeft />
    </button>
    <button
      v-if="showControls"
      class="carousel__navbutton carousel__navbutton--next"
      @click="nextSlide"
    >
      <IconChevronRight />
    </button>

    <div v-if="showControls" class="carousel__indicators">
      <button
        v-for="(_, index) in items"
        :key="index"
        :class="{
          'carousel__indicators__dot--active': currentSlide === index,
        }"
        class="carousel__indicators__dot"
        @click="setSlide(index)"
      />
    </div>

    <div v-if="!isPaused && isVisible && showControls" class="carousel__timer">
      {{ countdown }}s
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Hero } from '@/types/hero.types'
import { ChevronLeft as IconChevronLeft, ChevronRight as IconChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  items: Hero[]
  autoPlay?: boolean
  showControls?: boolean
}>()

const carouselRef = ref<HTMLElement | null>(null)
const currentSlide = ref(0)
const autoPlayInterval = ref<NodeJS.Timeout>()
const countdownInterval = ref<NodeJS.Timeout>()
const countdown = ref(7)
const isPaused = ref(false)
const isVisible = ref(true)

const setSlide = (index: number) => {
  currentSlide.value = index
  countdown.value = 7
  emit('slide-change', index)
}

const startAutoPlay = () => {
  // Si no hay autoplay habilitado o solo hay 1 slide, no hacer nada
  if (!props.autoPlay || props.items.length <= 1 || !isVisible.value) return

  // Limpiar intervalos existentes antes de iniciar nuevos
  stopAutoPlay()

  isPaused.value = false
  countdown.value = 7

  autoPlayInterval.value = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % props.items.length
    countdown.value = 7
    emit('slide-change', currentSlide.value)
  }, 7000)

  countdownInterval.value = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    }
  }, 1000)
}

const stopAutoPlay = () => {
  isPaused.value = true

  if (autoPlayInterval.value) {
    clearInterval(autoPlayInterval.value)
    autoPlayInterval.value = undefined
  }

  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
    countdownInterval.value = undefined
  }
}

const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + props.items.length) % props.items.length
  countdown.value = 7
  emit('slide-change', currentSlide.value)
}

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % props.items.length
  countdown.value = 7
  emit('slide-change', currentSlide.value)
}

const emit = defineEmits<{
  (e: 'slide-change', index: number): void
}>()

onMounted(() => {
  const observer = new IntersectionObserver(
    entries => {
      isVisible.value = entries[0].isIntersecting
      if (isVisible.value && props.autoPlay && props.items.length > 1 && !isPaused.value) {
        startAutoPlay()
      } else {
        stopAutoPlay()
      }
    },
    {
      threshold: 0.5,
    }
  )

  if (carouselRef.value) {
    observer.observe(carouselRef.value)
  }

  // Solo iniciar autoplay si está habilitado y hay más de 1 slide
  if (props.autoPlay && props.items.length > 1) {
    startAutoPlay()
  }
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style lang="scss" scoped>
$transition: 0.3s;
$spacing: 1rem;
$buttonSize: 88px;
$dotSize: 12px;

.carousel {
  position: relative;
  width: 100%;
  overflow: hidden;

  &__content {
    display: block;
    width: 100%;
  }

  &__slide {
    width: 100%;
    transition: opacity 0.5s;
  }

  &__slidecontent {
    color: white;
    padding: 0 130px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;

    h2 {
      font-size: 60px;
      line-height: 1.1;
      max-width: 770px;
    }

    p {
      font-size: 17px;
      color: $white-80;
    }
  }

  &__indicators {
    display: flex;
    gap: $spacing;
    justify-content: center;
    z-index: 2;
    margin-top: 50px;

    &__dot {
      width: $dotSize;
      height: $dotSize;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.5);
      border: none;
      cursor: pointer;
      transition: background-color $transition;
      pointer-events: auto;

      &--active {
        background-color: white;
      }
    }
  }

  &__timer {
    position: absolute;
    top: $spacing;
    right: $spacing;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: bold;
    z-index: 3;
    display: none;
  }

  &__navbutton {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: white;
    border: none;
    color: black;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color $transition;
    padding: 0;
    pointer-events: auto;
    z-index: 2;
    &:hover {
      background: #f0f0f0;
    }

    &--prev {
      left: $spacing;
    }

    &--next {
      right: $spacing;
    }

    svg {
      width: 24px;
      height: 24px;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
