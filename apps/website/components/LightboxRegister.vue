<template>
  <div :class="{ 'is-open': isOpen }" class="lightbox lightbox--register">
    <button title="Cerrar mensaje" type="button" class="lightbox__button" @click="closeLightbox">
      <IconX :size="24" />
    </button>
    <div class="lightbox--register__image">
      <IconGift :size="48" />
    </div>
    <div class="lightbox--register__content">
      <div class="lightbox--register__title">¡Consigue 3 anuncios gratis al registrarte!</div>
      <div class="lightbox--register__text">Cada anuncio dura 15 días publicado.</div>
      <div class="lightbox--register__button">
        <nuxt-link to="/registro" class="btn btn--primary" title="Registrarme ahora">
          Registrarme ahora
        </nuxt-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { X as IconX, Gift as IconGift } from 'lucide-vue-next'

const isOpen = ref(false)
const cookieName = 'site-register-closed'
const user = useStrapiUser()

const { $cookies } = useNuxtApp()

onMounted(() => {
  const state = $cookies.get(cookieName)
  if (!state && !user.value) {
    isOpen.value = true
  }
})

watch(user, newUser => {
  if (newUser) {
    isOpen.value = false
  }
})

function closeLightbox() {
  isOpen.value = false
  $cookies.set(cookieName, true)
}
</script>
