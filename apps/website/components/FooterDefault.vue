<template>
  <footer class="footer footer--default">
    <div class="footer--default__container">
      <div class="footer--default__logo">
        <LogoDefault />
      </div>
      <div class="footer--default__social">
        <SocialDefault />
      </div>
      <div class="footer--default__legal">
        <LegalDefault />
      </div>
    </div>
  </footer>
</template>

<script setup>
import SocialDefault from '@/components/SocialDefault.vue'
import LegalDefault from '@/components/LegalDefault.vue'
import LogoDefault from '@/components/LogoDefault.vue'
</script>
