<!-- pages/registro.vue -->
<template>
  <div class="page page--auth">
    <h1 class="page--auth__title">Todo lo que amas<br />en un solo lugar</h1>
    <div class="page--auth__form">
      <FormLogin />
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
import FormLogin from '@/components/FormLogin.vue'
import LinksAuth from '@/components/LinksAuth.vue'
import LoginWithGoogle from '@/components/LoginWithGoogle.vue'
import { definePageMeta } from '#imports'

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})
</script>
