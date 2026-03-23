<template>
  <div class="page page--auth">
    <h1 class="page--auth__title">Modo Desarrollo<br />Acceso Restringido</h1>
    <div class="page--auth__form">
      <FormDev />
    </div>
    <div class="page--auth__info">
      <p>Este sitio está en modo desarrollo. Ingresa las credenciales para continuar.</p>
    </div>
  </div>
</template>

<script setup>
import FormDev from '@/components/FormDev.vue'
import { definePageMeta } from '#imports'

definePageMeta({
  layout: 'auth',
})
</script>
