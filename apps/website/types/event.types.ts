export interface EventDate {
  id: number
  date: string
  start_time: string
  end_time: string
}

export interface EventPrice {
  id: number
  name: string
  price: number
}

export interface Commune {
  id: number
  documentId: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
  publishedAt: string
}

export interface Event {
  id: number
  documentId: string
  title: string
  slug: string
  description: string
  about: string
  createdAt: string
  updatedAt: string
  publishedAt: string
  company: string | null
  isFree: boolean | null
  address: string | null
  address_number: string | null
  ticket_url: string | null
  categories: {
    id: number
    documentId: string
    name: string
    slug: string
    description: string | null
    createdAt: string
    updatedAt: string
    publishedAt: string
  }[]
  commune: Commune | null
  region: {
    id: number
    name: string
    slug: string
  } | null
  banner: {
    url: string
    alternativeText: string | null
    caption: string | null
  } | null
  poster: {
    url: string
    alternativeText: string | null
    caption: string | null
  }[]
  gallery: {
    url: string
    alternativeText: string | null
    caption: string | null
  }[]
  prices: EventPrice[]
  dates: EventDate[]
  socialLinks: {
    id: number
    platform: string
    url: string
  }[]
  videos: { id: number; link: string }[]
}

export interface StrapiResponse<T> {
  data: T
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  populate?: string[]
  filters?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string | null
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
}

export interface CategoryWithEvents extends Category {
  events: Event[]
}
