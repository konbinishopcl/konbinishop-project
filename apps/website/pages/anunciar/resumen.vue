<!-- pages/anunciar/resumen.vue -->
<template>
  <div class="page page--summary">
    <div class="page--summary__container">
      <div class="page--summary__header">
        <h1 class="page--summary__title">Resumen</h1>
      </div>
      <div class="page--summary__body">
        <div class="page--summary__body-left">
          <SummaryDefault />
        </div>
        <div class="page--summary__body-right">
          <CartDefault />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { definePageMeta } from '#imports'
import SummaryDefault from '@/components/SummaryDefault.vue'
import CartDefault from '@/components/CartDefault.vue'

definePageMeta({
  layout: 'create',
  middleware: 'auth',
})
</script>
