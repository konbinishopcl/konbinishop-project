<!-- pages/anunciar/[step].vue -->
<template>
  <div class="page page--create">
    <CreateDefault :categories="categories ?? []" :regions="regions ?? []" :store="createStore" />
  </div>
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports'
import { useRegionStore } from '@/stores/region.store'
import { useCategoryStore } from '@/stores/category.store'
import { useCreateStore } from '@/stores/create.store'

const regionStore = useRegionStore()
const categoryStore = useCategoryStore()
const createStore = useCreateStore()

const { data: regions } = await useAsyncData('regions', async () => {
  await regionStore.fetchRegions()
  return regionStore.regions
})

const { data: categories } = await useAsyncData('categories', async () => {
  await categoryStore.fetchCategories()
  return categoryStore.categories
})

definePageMeta({
  layout: 'create',
  middleware: 'auth',
})
</script>
