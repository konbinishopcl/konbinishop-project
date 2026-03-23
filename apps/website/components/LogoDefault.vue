<template>
  <NuxtLink class="layout--auth__wrapper__introduction__logo" to="/">
    <NuxtImg :src="src" :alt="alt" :width="width" />
  </NuxtLink>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    width: {
      type: Number,
      default: 100,
    },
    src: {
      type: String,
      default: '/images/logo.svg',
    },
    alt: {
      type: String,
      default: 'Logo Konbini Shop',
    },
  },
})
</script>
