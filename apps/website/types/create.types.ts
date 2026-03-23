export interface Price {
  name: string
  value: number
  description?: string
  errors?: {
    name?: string
    value?: string
  }
}

export interface Prices {
  isFree: boolean
  prices: Price[]
}

export interface DateEvent {
  date: string
  startTime: string
  endTime: string
}

export interface Address {
  address?: string
  address_number?: string
  commune?: string
  region?: string
}

export interface CreateForm {
  // Paso 1
  title: string
  company: string
  category: string
  description: string
  about: string
  prices: Prices

  // Paso 2
  dates: DateEvent[]
  address: Address
  ticket_url: string
  socialLinks: string[]

  // Paso 3
  banner: File | null
  poster: File | null
  gallery: File[]
  videos: string[]
}
