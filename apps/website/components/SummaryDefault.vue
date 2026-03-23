<template>
  <div class="resume resume--default">
    <div class="resume__section">
      <div class="resume__header">
        <h2 class="resume__title">Información Básica del Evento</h2>
        <NuxtLink to="/anunciar/1" class="resume__edit">Editar</NuxtLink>
      </div>

      <div class="resume__field">
        <p class="resume__label">Título del evento</p>
        <p class="resume__value">{{ store.form.title }}</p>
      </div>

      <div class="resume__field">
        <p class="resume__label">Categoría</p>
        <p class="resume__value">{{ store.form.category }}</p>
      </div>

      <div class="resume__field">
        <p class="resume__label">Empresa</p>
        <p class="resume__value">{{ store.form.company }}</p>
      </div>

      <div class="resume__field">
        <p class="resume__label">Descripción General</p>
        <p class="resume__value">{{ store.form.description }}</p>
      </div>

      <div class="resume__field">
        <p class="resume__label">Precios</p>
        <div class="resume__prices">
          <p v-for="(price, type) in store.form.prices" :key="type" class="resume__price">
            {{ type }} - {{ price }} CLP
          </p>
        </div>
      </div>
    </div>

    <div class="resume__section">
      <div class="resume__header">
        <h2 class="resume__title">Información Básica del Evento</h2>
        <NuxtLink to="/anunciar/2" class="resume__edit">Editar</NuxtLink>
      </div>

      <div class="resume__field">
        <p class="resume__label">Día y Hora del Evento</p>
        <div class="resume__dates">
          <p v-for="(date, index) in store.form.dates" :key="index" class="resume__date">
            {{ date }}
          </p>
        </div>
      </div>

      <div class="resume__field">
        <p class="resume__label">Lugar del Evento</p>
        <p class="resume__value">{{ store.form.venue }}</p>
      </div>

      <div class="resume__field">
        <p class="resume__label">Ubicación del evento</p>
        <p class="resume__value">{{ store.form.location }}</p>
      </div>

      <div class="resume__field">
        <p class="resume__label">Sitio Web</p>
        <p class="resume__value">{{ store.form.website }}</p>
      </div>

      <div class="resume__field">
        <p class="resume__label">Red Social</p>
        <p class="resume__value">{{ store.form.social }}</p>
      </div>
    </div>

    <div class="resume__section">
      <div class="resume__header">
        <h2 class="resume__title">Imágenes del evento</h2>
        <NuxtLink to="/anunciar/3" class="resume__edit">Editar</NuxtLink>
      </div>

      <div class="resume__field">
        <p class="resume__label">Imágenes principales</p>
        <div class="resume__images">
          <div class="resume__image-item">
            <p class="resume__image-label">Imagen principal (Banner del evento)</p>
            <div class="resume__image-preview">
              <!-- Aquí iría la imagen -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCreateStore } from '@/stores/create.store'

const store = useCreateStore()
</script>

<style lang="scss" scoped>
.resume {
  &--default {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  &__section {
    background: #1a1a1a;
    border-radius: 0.5rem;
    padding: 1.5rem;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #fff;
  }

  &__edit {
    color: #fff;
    background: none;
    border: none;
    cursor: pointer;
    text-decoration: underline;
  }

  &__field {
    margin-bottom: 1rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__label {
    color: #666;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  &__value {
    color: #fff;
  }

  &__prices,
  &__dates {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__images {
    display: grid;
    gap: 1rem;
  }

  &__image-item {
    border: 1px solid #333;
    padding: 1rem;
    border-radius: 0.25rem;
  }

  &__image-label {
    color: #666;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  &__image-preview {
    aspect-ratio: 16/9;
    background: #333;
    border-radius: 0.25rem;
  }
}
</style>
