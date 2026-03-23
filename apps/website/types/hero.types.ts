export interface Hero {
  id: number
  documentId: string
  title: string
  slug: string
  date: string
  address: string
  address_number: string
  venue: string
  link: string
  createdAt: string
  updatedAt: string
  publishedAt: string
  desktop_image: StrapiImage
  tablet_image: StrapiImage
  mobile_image: StrapiImage
  thumbnail: StrapiImage
  categories?: {
    data: Array<{
      id: number
      attributes: {
        name: string
      }
    }>
  }
  region?: {
    data: {
      id: number
      attributes: {
        name: string
      }
    }
  }
  comuna?: {
    data: {
      id: number
      attributes: {
        name: string
      }
    }
  }
}

interface StrapiImage {
  id: number
  documentId: string
  name: string
  alternativeText: string | null
  caption: string | null
  width: number
  height: number
  formats: {
    thumbnail: ImageFormat
    large?: ImageFormat
    medium?: ImageFormat
    small?: ImageFormat
  }
  hash: string
  ext: string
  mime: string
  size: number
  url: string
  previewUrl: string | null
  provider: string
  provider_metadata: {
    [key: string]: string | number | boolean | null
  }
  createdAt: string
  updatedAt: string
  publishedAt: string
}

interface ImageFormat {
  name: string
  hash: string
  ext: string
  mime: string
  path: string | null
  width: number
  height: number
  size: number
  sizeInBytes: number
  url: string
}
