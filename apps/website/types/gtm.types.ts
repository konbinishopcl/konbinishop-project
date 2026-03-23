declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

export interface GTMConfig {
  gtmId: string
  debug?: boolean
}

export interface GTMEvent {
  event: string
  [key: string]: unknown
}

export interface GTMPageView {
  page_path: string
  page_title?: string
  page_location?: string
}
