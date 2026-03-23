<template>
  <section class="login login--default">
    <h1 class="login--default__title">Todo lo que amas<br />en un solo lugar</h1>
    <div class="login--default__form">
      <FormRegister />
    </div>
    <div class="login--default__links">
      <LinksAuth />
    </div>
  </section>
</template>

<script setup>
import FormRegister from './FormRegister.vue'
import LinksAuth from './LinksAuth.vue'
</script>
