<!-- pages/registro.vue -->
<template>
  <div class="page page--auth">
    <h1 class="page--auth__title">Todo lo que amas<br />en un solo lugar</h1>
    <div class="page--auth__form">
      <FormRegister />
    </div>
    <div class="page--auth__providers">
      <LoginWithGoogle />
    </div>
    <div class="page--auth__links">
      <LinksAuth />
    </div>
  </div>
</template>

<script setup>
import FormRegister from '@/components/FormRegister.vue'
import LinksAuth from '@/components/LinksAuth.vue'
import { definePageMeta } from '#imports'

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})
</script>
