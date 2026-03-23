import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Category, CategoryResponse } from '@/types/category.types'

const ONE_HOUR = 60 * 60 * 1000 // 1 hora en milisegundos

export const useCategoryStore = defineStore(
  'category',
  () => {
    const categories = ref<Category[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const lastFetch = ref<number>(0)

    const shouldRefresh = () => {
      return Date.now() - lastFetch.value > ONE_HOUR
    }

    const fetchCategories = async () => {
      // Si tenemos categorías y no han pasado más de una hora, no hacemos nada
      if (categories.value.length > 0 && !shouldRefresh()) {
        return categories.value
      }

      try {
        loading.value = true
        error.value = null

        // Obtener categorías con conteo de eventos
        const response = await useStrapiClient()<CategoryResponse>('categories', {
          params: {
            populate: {
              events: {
                fields: ['id'],
              },
            },
          },
        })

        // Procesar las categorías para agregar el conteo de eventos
        const categoriesWithCount = response.data.map(category => ({
          ...category,
          eventsCount: category.events?.length || 0,
        }))

        // Ordenar por cantidad de eventos (descendente) y luego por nombre
        categoriesWithCount.sort((a, b) => {
          if (b.eventsCount !== a.eventsCount) {
            return b.eventsCount - a.eventsCount
          }
          return a.name.localeCompare(b.name)
        })

        categories.value = categoriesWithCount
        lastFetch.value = Date.now()
        return categoriesWithCount
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Error al cargar las categorías'
        console.error('Error fetching categories:', err)
        return []
      } finally {
        loading.value = false
      }
    }

    const getCategoryById = (id: number) => {
      return categories.value.find(category => category.id === id)
    }

    const getCategoryBySlug = (slug: string) => {
      return categories.value.find(category => category.slug === slug)
    }

    return {
      categories,
      loading,
      error,
      fetchCategories,
      getCategoryById,
      getCategoryBySlug,
      lastFetch,
    }
  },
  {
    persist: {
      storage: import.meta.client ? localStorage : undefined,
      key: 'categories',
      paths: ['categories', 'lastFetch'],
    },
  }
)
