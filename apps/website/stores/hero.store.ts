import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Hero } from '@/types/hero.types'

export const useHeroStore = defineStore(
  'hero',
  () => {
    const heroes = ref<Hero[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchHeroes(): Promise<{ data: Hero[] }> {
      loading.value = true
      error.value = null

      try {
        console.log('Fetching heroes...')

        // Consulta con imágenes para mostrar en el hero
        const response = await useStrapiClient()<{ data: Hero[] }>('heroes', {
          params: {
            populate: {
              desktop_image: true,
              tablet_image: true,
              mobile_image: true,
              thumbnail: true,
            },
            filters: {
              publishedAt: {
                $notNull: true,
              },
            },
            sort: ['publishedAt:desc'],
          },
        })

        console.log('API Response:', response)
        console.log('Response type:', typeof response)
        console.log('Response keys:', Object.keys(response || {}))

        // Verificar si hay error en la respuesta
        if (response && response.error) {
          console.error('Strapi API Error:', response.error)
          throw new Error(`Error de Strapi: ${response.error.message || 'Error desconocido'}`)
        }

        // Verificar si data es null
        if (!response || !response.data) {
          console.warn('No heroes data received from API')
          console.warn('Full response:', response)
          heroes.value = []
          return { data: [] }
        }

        heroes.value = response.data
        return response
      } catch (err) {
        console.error('Error fetching heroes:', err)
        error.value = err instanceof Error ? err.message : 'Error al obtener los heroes'
        heroes.value = []
        throw err
      } finally {
        loading.value = false
      }
    }

    return {
      heroes,
      loading,
      error,
      fetchHeroes,
    }
  },
  {
    persist: {
      storage: import.meta.client ? localStorage : undefined,
    },
  }
)
