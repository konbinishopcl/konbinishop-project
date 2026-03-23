<template>
  <div class="page page--contact" />
</template>

<script setup>
// Aplicar el middleware 'auth' para usuarios no autenticados
definePageMeta({
  middleware: 'auth',
})
</script>
