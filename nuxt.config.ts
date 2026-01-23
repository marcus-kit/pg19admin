// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-01-22',
  devtools: { enabled: true },

  // Отключаем features которые не нужны
  features: {
    devLogs: false,
    appManifest: false
  },

  // Компоненты: pathPrefix: false — регистрация по имени файла
  components: [
    { path: '~/components', pathPrefix: false }
  ],

  // Глобальные стили
  css: ['~/assets/css/main.css'],

  // Модули
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    '@nuxtjs/color-mode',
    '@nuxtjs/supabase'
  ],

  // Supabase Auth — используем встроенную авторизацию
  supabase: {
    redirect: false,
    cookieOptions: {
      maxAge: 60 * 60 * 8, // 8 часов
      sameSite: 'strict',
      secure: true
    }
  },

  // Runtime конфигурация
  runtimeConfig: {
    // Server-only (не попадают в клиентский бандл)
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',

    // Public (доступны и на клиенте)
    public: {
      supabaseUrl: process.env.SUPABASE_URL || 'https://supabase.doka.team',
      supabaseKey: process.env.SUPABASE_KEY || ''
    }
  },

  // Color Mode — тёмная тема по умолчанию
  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark'
  },

  // SEO и мета
  app: {
    head: {
      title: 'ПЖ19 — Админ-панель',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Административная панель ПЖ19' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  }
})
