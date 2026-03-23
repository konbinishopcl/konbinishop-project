export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  articles?: Article[]
  event?: Event
  events?: Event[]
  eventsCount?: number
  createdAt: string
  updatedAt: string
}

export interface Article {
  id: number
  title: string
  content: string
  category: Category
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: number
  title: string
  description: string
  category: Category
  createdAt: string
  updatedAt: string
}

export interface CategoryResponse {
  data: Category[]
  meta: {
    pagination: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}
