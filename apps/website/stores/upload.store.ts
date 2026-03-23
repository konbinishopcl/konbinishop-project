import { defineStore } from 'pinia'
import Swal from 'sweetalert2'
import type { StrapiResponse } from '../types/upload.types'

export interface UploadStoreState {
  loading: boolean
  error: string | null
}

export interface UploadStoreActions {
  uploadImage(file: File): Promise<StrapiResponse[]>
}

export const useUploadStore = defineStore('upload', {
  state: () => ({
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async uploadImage(file: File): Promise<StrapiResponse[]> {
      this.loading = true
      this.error = null

      try {
        const formData = new FormData()
        formData.append('files', file)

        const client = useStrapiClient()
        const response = await client<StrapiResponse[]>('upload', {
          method: 'POST',
          body: formData,
        })
        return response
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error uploading image'
        this.error = errorMessage
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
        })
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
