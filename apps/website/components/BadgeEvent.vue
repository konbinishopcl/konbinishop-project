<template>
  <NuxtLink :to="categoryUrl" class="badge badge__event">
    <Tag class="badge__event__icon" />
    <span class="badge__event__text">{{ text }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { Tag } from 'lucide-vue-next'

interface Props {
  text: string
  slug: string
}

const props = defineProps<Props>()

const categoryUrl = computed(() => {
  return `/${props.slug}`
})
</script>
