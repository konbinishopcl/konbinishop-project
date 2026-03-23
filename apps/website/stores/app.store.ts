import { defineStore } from 'pinia'
import type { AppState } from '@/types/app'

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    isSearchLightboxActive: false,
    isLoginLightboxActive: false,
    referer: null,
    contactFormSent: false,
    cookiesAccepted: false,
  }),

  getters: {
    getIsSearchLightboxActive: state => state.isSearchLightboxActive,
    getIsLoginLightboxActive: state => state.isLoginLightboxActive,
    getReferer: state => state.referer,
    getContactFormSent: state => state.contactFormSent,
    getCookiesAccepted: state => state.cookiesAccepted,
  },

  actions: {
    // Acciones para el lightbox de búsqueda
    openSearchLightbox(): void {
      this.isSearchLightboxActive = true
    },

    closeSearchLightbox(): void {
      this.isSearchLightboxActive = false
    },

    toggleSearchLightbox(): void {
      this.isSearchLightboxActive = !this.isSearchLightboxActive
    },

    // Acciones para el lightbox de inicio de sesión
    openLoginLightbox(): void {
      this.isLoginLightboxActive = true
    },

    closeLoginLightbox(): void {
      this.isLoginLightboxActive = false
    },

    toggleLoginLightbox(): void {
      this.isLoginLightboxActive = !this.isLoginLightboxActive
    },

    // Acciones para la URL de referencia
    setReferer(url: string): void {
      this.referer = url
    },

    clearReferer(): void {
      this.referer = null
    },

    // Acciones para el formulario de contacto
    setContactFormSent(): void {
      this.contactFormSent = true
    },

    clearContactFormSent(): void {
      this.contactFormSent = false
    },

    // Acciones para las cookies
    acceptCookies(): void {
      this.cookiesAccepted = true
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'accept_cookies',
        consent: {
          ad_storage: 'granted',
          analytics_storage: 'granted',
        },
      })
    },
  },

  persist: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
  },
})
