// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  // Модули
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    '@nuxtjs/color-mode',
    '@nuxtjs/supabase',
    '@nuxt/eslint',
  ],

  // Компоненты: pathPrefix: false — регистрация по имени файла
  components: [
    { path: '~/components', pathPrefix: false },
  ],
  devtools: { enabled: true },

  // SEO и мета
  app: {
    head: {
      title: 'ПЖ19 — Админ-панель',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Административная панель ПЖ19' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  // Глобальные стили
  css: ['~/assets/css/main.css'],

  // Color Mode — тёмная тема по умолчанию
  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark',
  },

  // Runtime конфигурация
  runtimeConfig: {
    // Server-only (не попадают в клиентский бандл)
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',

    // Public (доступны и на клиенте)
    public: {
      supabaseUrl: process.env.SUPABASE_URL || 'https://supabase.doka.team',
      supabaseKey: process.env.SUPABASE_KEY || '',
    },
  },

  // Отключаем features которые не нужны
  features: {
    devLogs: false,
    appManifest: false,
  },
  compatibilityDate: '2026-01-22',

  // ESLint — по CODE-STYLE-GUIDE
  eslint: {
    config: {
      stylistic: {
        indent: 2,
        quotes: 'single',
        semi: false,
        commaDangle: 'always-multiline',
      },
    },
  },

  // Supabase Auth — используем встроенную авторизацию
  supabase: {
    redirect: false,
    cookieOptions: {
      maxAge: 60 * 60 * 8, // 8 часов
      sameSite: 'strict',
      secure: true,
    },
  },
})
