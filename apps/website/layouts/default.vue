<template>
  <div class="layout layout--default">
    <div class="layout--default__header">
      <HeaderDefault />
    </div>
    <div class="layout--default__body">
      <NuxtPage />
    </div>
    <div class="layout--default__footer">
      <FooterDefault />
    </div>
    <LightboxCookies />
  </div>
</template>

<script setup>
import HeaderDefault from '@/components/HeaderDefault.vue'
import FooterDefault from '@/components/FooterDefault.vue'
import LightboxCookies from '@/components/LightboxCookies.vue'
</script>
