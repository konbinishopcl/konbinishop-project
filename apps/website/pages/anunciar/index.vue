<!-- pages/anunciar/index.vue -->
<template>
  <div />
</template>

<script setup>
import { definePageMeta, useRouter } from '#imports'

definePageMeta({
  layout: 'create',
  middleware: 'auth',
})

const router = useRouter()
router.replace('/anunciar/1')
</script>
