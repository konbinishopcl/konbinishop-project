export interface UploadStore {
  loading: boolean
  error: string | null
  uploadImage: (file: File) => Promise<Array<{ url: string }>>
}

export interface StrapiResponse {
  id: number
  documentId: string
  name: string
  alternativeText: string | null
  caption: string | null
  width: number
  height: number
  formats: {
    thumbnail: {
      url: string
    }
    small: {
      url: string
    }
    medium: {
      url: string
    }
  }
  hash: string
  ext: string
  mime: string
  size: number
  url: string
  previewUrl: string | null
  provider: string
  provider_metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  publishedAt: string
}
