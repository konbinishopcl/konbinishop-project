import type { EventDate, Event } from '../types/event.types'
import { useImageUrl } from './useImageUrl'

export function useEvents() {
  const { getImageUrl } = useImageUrl()

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
    return date.toLocaleDateString('es-CL', options)
  }

  const getEarliestDate = (
    dates: EventDate[]
  ): { date: string | null; hasMultipleDates: boolean } => {
    if (!dates || dates.length === 0) return { date: null, hasMultipleDates: false }

    const sortedDates = [...dates].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.start_time}`)
      const dateB = new Date(`${b.date}T${b.start_time}`)
      return dateA.getTime() - dateB.getTime()
    })

    return {
      date: formatDate(sortedDates[0].date),
      hasMultipleDates: sortedDates.length > 1,
    }
  }

  const getLocation = (event: Event): string => {
    if (event.company && event.company.trim() !== '') return event.company
    if (event.commune?.name && event.commune.name.trim() !== '') return event.commune.name
    return 'Ubicación no especificada'
  }

  const getPosterImage = (event: Event): string => {
    if (!event.poster?.url) return '/images/default-event.jpg'
    return getImageUrl(event.poster.url)
  }

  return {
    getEarliestDate,
    getLocation,
    getPosterImage,
  }
}
