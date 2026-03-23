<template>
  <div :class="{ 'is-open': isOpen }" class="lightbox lightbox--site-checker">
    <button title="Cerrar mensaje" type="button" class="lightbox__button" @click="closeLightbox">
      <IconX :size="24" />
    </button>
    <div class="lightbox--site-checker__content">
      <div class="lightbox--site-checker__title">Problema detectado</div>
      <div class="lightbox--site-checker__text">
        Estás utilizando un bloqueador de anuncios, lo que podría afectar el funcionamiento del
        sitio. Para una mejor experiencia, desactívalo o configúralo para permitir este sitio.
      </div>
      <div class="lightbox--site-checker__buttons">
        <div class="lightbox--site-checker__buttons__message">
          Este mensaje se cerrará automáticamente en {{ countdown }} segundos.
        </div>
        <button class="btn btn--primary btn--block" title="Cerrar" @click="closeLightbox">
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { X as IconX } from 'lucide-vue-next'

const isOpen = ref(false)
const countdown = ref(20)
let countdownInterval: ReturnType<typeof setInterval> | null = null

const { $checkSiteHealth } = useNuxtApp()

interface SiteHealthResult {
  hasError: boolean
  errorDetails: Array<{
    type: string
    message: string
  }>
}

onMounted(() => {
  checkAdBlock()
})

function checkAdBlock() {
  ;($checkSiteHealth as () => Promise<SiteHealthResult>)().then(result => {
    if (result.hasError) {
      isOpen.value = true
      startCountdown()
    }
  })
}

function startCountdown() {
  countdownInterval = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1
    } else {
      closeLightbox()
    }
  }, 1000)
}

function closeLightbox() {
  isOpen.value = false
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
}
</script>
