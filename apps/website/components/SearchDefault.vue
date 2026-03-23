<template>
  <form class="form form--search" @submit.prevent="search">
    <input v-model="query" class="form--search__control" type="search" placeholder="Search" />
    <button class="form--search__button" type="submit">
      <i class="fas fa-search" />
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'

// Define the query property
const query = ref('')

const search = () => {
  // TODO: Implementar búsqueda
}
</script>
