<!-- layouts/auth.vue -->
<template>
  <div class="layout layout--auth">
    <div class="layout--auth__wrapper">
      <div class="layout--auth__wrapper__introduction">
        <NuxtImg
          class="layout--auth__wrapper__introduction__bg"
          src="/images/auth_bg.png"
          alt="Logo"
          width="1027"
          height="1080"
        />
        <NuxtLink class="layout--auth__wrapper__introduction__logo" to="/">
          <NuxtImg src="/images/logo.svg" alt="Logo" width="190" />
        </NuxtLink>
      </div>
      <div class="layout--auth__wrapper__content">
        <div class="layout--auth__wrapper__content__header" />
        <div class="layout--auth__wrapper__content__body">
          <NuxtPage />
        </div>
        <div class="layout--auth__wrapper__content__bottom">
          <LegalDefault />
        </div>
      </div>
    </div>
    <LightboxCookies />
    <LightboxAdblock />
  </div>
</template>

<script setup>
import LegalDefault from '@/components/LegalDefault.vue'
import LightboxCookies from '@/components/LightboxCookies.vue'
import LightboxAdblock from '@/components/LightboxAdblock.vue'
</script>
