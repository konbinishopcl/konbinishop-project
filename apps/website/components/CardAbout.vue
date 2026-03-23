<template>
  <div class="card card--about">
    <div class="card--about__header">
      <FileText class="card--about__icon" />
      <span class="card--about__title">Acerca de</span>
    </div>
    <div class="card--about__content">
      <p v-if="description" class="card--about__text">{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileText } from 'lucide-vue-next'

interface Props {
  description?: string
}

defineProps<Props>()
</script>
