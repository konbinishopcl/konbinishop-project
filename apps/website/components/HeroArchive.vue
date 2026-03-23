<template>
  <section class="hero hero--archive">
    <div class="hero--archive__bg">
      <NuxtImg :src="image" :alt="title" />
    </div>
    <div class="hero--archive__content">
      <h1 class="hero--archive__content__title">{{ title }}</h1>
      <div class="hero--archive__content__description">
        <p>{{ description }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  image?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Eventos',
  description: 'Descubre todos los eventos de nuestra categoría',
  image: '/images/hero.png',
})
</script>
