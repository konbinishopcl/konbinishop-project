import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Region, RegionResponse } from '@/types/region.types'

interface RegionState {
  regions: Region[]
  loading: boolean
  error: string | null
}

export const useRegionStore = defineStore(
  'region',
  () => {
    const regions = ref<Region[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    const fetchRegions = async () => {
      try {
        loading.value = true
        error.value = null
        const response = await useStrapiClient()<RegionResponse>('regions', {
          params: {
            populate: 'communes',
          },
        })
        regions.value = response.data
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Error al cargar las regiones'
        console.error('Error fetching regions:', err)
      } finally {
        loading.value = false
      }
    }

    const getRegionById = (id: number) => {
      return regions.value.find(region => region.id === id)
    }

    const getCommuneById = (regionId: number, communeId: number) => {
      const region = getRegionById(regionId)
      return region?.communes.find(commune => commune.id === communeId)
    }

    // Cargar regiones al inicializar el store
    fetchRegions()

    return {
      regions,
      loading,
      error,
      fetchRegions,
      getRegionById,
      getCommuneById,
    }
  },
  {
    persist: {
      storage: import.meta.client ? localStorage : undefined,
      paths: ['regions'],
    },
  }
)
