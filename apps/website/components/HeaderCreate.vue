<template>
  <header
    class="header header--create headroom"
    :class="{ 'headroom--scrolled': isScrolled, 'headroom--hidden': isHidden }"
  >
    <div class="header--create__container">
      <div class="header--create__left">
        <LogoDefault />
      </div>
      <div class="header--create__right">
        <div class="button button--help">
          <IconHelpCircle class="button--help__icon" />
          <span>Ayuda</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import LogoDefault from './LogoDefault.vue'
import { HelpCircle as IconHelpCircle } from 'lucide-vue-next'
import { useScrollHeader } from '@/composables/useScrollHeader'

const { isScrolled, isHidden } = useScrollHeader()
</script>
