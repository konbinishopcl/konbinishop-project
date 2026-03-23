import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  Event,
  PaginationParams,
  PaginatedResponse,
  StrapiResponse,
} from '../types/event.types'

export const useEventStore = defineStore('event', () => {
  const events = ref<Event[]>([])
  const currentEvent = ref<Event | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<Omit<PaginatedResponse<Event>, 'data'>>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  })

  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  async function saveEvent(event: Event) {
    loading.value = true
    error.value = null

    try {
      const response = await useStrapiClient()<StrapiResponse<Event>>('events', {
        method: 'POST',
        body: event,
      })

      const savedEvent = response.data.data
      return savedEvent
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al guardar el evento'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getEvents(params: PaginationParams): Promise<PaginatedResponse<Event>> {
    loading.value = true
    error.value = null

    try {
      const response = await useStrapiClient()<StrapiResponse<Event[]>>('events', {
        params: {
          'pagination[page]': params.page,
          'pagination[pageSize]': params.limit,
          ...(params.sortBy && { sort: `${params.sortBy}:${params.sortOrder || 'asc'}` }),
          ...(params.filters && params.filters),
          populate: {
            category: true,
            commune: true,
            region: true,
            banner: true,
            poster: true,
            gallery: true,
            prices: true,
            dates: true,
            socialLinks: true,
            videos: true,
          },
        },
      })

      // Si no hay paginación, creamos una respuesta paginada manualmente
      if (!response.meta?.pagination) {
        return {
          data: response.data,
          total: response.data.length,
          page: 1,
          limit: response.data.length,
          totalPages: 1,
        }
      }

      pagination.value = {
        total: response.meta.pagination.total,
        page: response.meta.pagination.page,
        limit: response.meta.pagination.pageSize,
        totalPages: response.meta.pagination.pageCount,
      }

      return {
        data: response.data,
        ...pagination.value,
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al obtener los eventos'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getEventBySlug(slug: string): Promise<Event[]> {
    loading.value = true
    error.value = null

    try {
      const response = await useStrapiClient()<StrapiResponse<Event[]>>('events', {
        params: {
          'filters[slug][$eq]': slug,
          populate: {
            category: true,
            commune: true,
            region: true,
            banner: true,
            poster: true,
            gallery: true,
            prices: true,
            dates: true,
            socialLinks: true,
            videos: true,
          },
        },
      })

      console.log('Raw Strapi Response:', JSON.stringify(response, null, 2))
      const events = response.data || []
      console.log('Events found:', events)
      currentEvent.value = events[0] || null
      return events
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al obtener el evento'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setCurrentEvent(event: Event | null) {
    currentEvent.value = event
  }

  function clearCurrentEvent() {
    currentEvent.value = null
  }

  return {
    events,
    currentEvent,
    loading,
    error,
    pagination,
    saveEvent,
    getEvents,
    getEventBySlug,
    setCurrentEvent,
    clearCurrentEvent,
  }
})
