<template>
  <div class="layout layout--create">
    <div class="layout--create__content">
      <HeaderCreate />
      <NuxtPage />
      <FooterCreate />
    </div>
    <div class="layout--create__bg">
      <NuxtImg src="/images/auth_bg.png" alt="Create Background" width="1027" height="1080" />
    </div>
    <LightboxCookies />
  </div>
</template>

<script setup>
import HeaderCreate from '@/components/HeaderCreate.vue'
import FooterCreate from '@/components/FooterCreate.vue'
import LightboxCookies from '@/components/LightboxCookies.vue'
</script>
