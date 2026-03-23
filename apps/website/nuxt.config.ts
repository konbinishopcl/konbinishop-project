// https://nuxt.com/docs/api/configuration/nuxt-config

// import purgeCss from 'vite-plugin-purgecss'

export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  runtimeConfig: {
    // Variables privadas (solo servidor)
    devUsername: process.env.DEV_USERNAME || 'konbinishop',
    devPassword: process.env.DEV_PASSWORD || 'konbinishopdev',

    public: {
      apiUrl: process.env.API_URL || 'http://localhost:1337',
      blockSearchEngines: process.env.BLOCK_SEARCH_ENGINES === 'true',
      devMode: process.env.DEV_MODE === 'true',
      gtmId: process.env.GTM_ID || 'GTM-XXXXXXXX',
      sentry: {
        dsn:
          process.env.SENTRY_DSN ||
          'https://cea8c8cfaaad211fce2804f63b582f39@o4509929700196352.ingest.us.sentry.io/4509940269252608',
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
        replaysOnErrorSampleRate: 1.0,
      },
    },
  },

  css: ['@/assets/fonts/satoshi/stylesheet.css', '@/assets/styles/app.scss'],

  modules: [
    '@nuxt/eslint',
    '@nuxtjs/strapi',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxt/image',
    '@nuxtjs/seo',
    '@sentry/nuxt/module',
  ],

  image: {
    provider: 'ipx',
    preload: false,
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },

  pinia: {
    storesDirs: ['./stores/**'],
  },

  piniaPersistedstate: {
    storage: 'localStorage',
  },

  strapi: {
    url: process.env.API_URL || 'http://localhost:1337',
    prefix: '/api',
    version: 'v4',
    cookie: {
      path: '/',
      maxAge: 86400, // 1 día en segundos
    },
    cookieName: 'strapi_jwt',
  },

  plugins: [],

  eslint: {
    config: {
      stylistic: false,
    },
  },

  // Configuración de robots
  robots: {
    rules: [
      {
        UserAgent: '*',
        Disallow: ['/dev', '/cuenta'],
        Allow: '/',
      },
    ],
  },

  // Configuración de sitemap
  sitemap: {
    exclude: ['/dev', '/cuenta'],
  },

  app: {
    head: {
      title: 'Konbini',
      htmlAttrs: {
        lang: 'es',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        ...(process.env.BLOCK_SEARCH_ENGINES === 'true'
          ? [{ name: 'robots', content: 'noindex, nofollow' }]
          : []),
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
        },
      ],
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/styles/base/variables" as *;`,
        },
      },
    },
  },

  sentry: {
    sourceMapsUploadOptions: {
      org: 'konbinishopcl',
      project: 'konbini-listing',
    },

    autoInjectServerSentry: 'top-level-import',
  },

  sourcemap: {
    client: 'hidden',
  },
})
