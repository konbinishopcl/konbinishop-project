<template>
  <div class="image image__poster">
    <NuxtImg :src="imageUrl" :alt="alt" class="image__poster__image" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  imageUrl: string
  alt: string
}

defineProps<Props>()
</script>
