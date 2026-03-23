<template>
  <div class="legal legal--default">
    <p aria-label="Información legal">
      © {{ displayYear }} Todos los derechos reservados -
      <NuxtLink to="/terminos-de-servicio">Términos de servicio</NuxtLink> -
      <NuxtLink to="/politicas-de-privacidad">Políticas de privacidad</NuxtLink>
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      currentYear: new Date().getFullYear(),
    }
  },
  computed: {
    displayYear() {
      return this.currentYear > 2024 ? `2024 - ${this.currentYear}` : `${this.currentYear}`
    },
  },
})
</script>
