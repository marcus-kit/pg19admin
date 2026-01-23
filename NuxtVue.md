# Nuxt 4 & Vue 3 — Актуальная документация

> Обновлено: 2026-01-23 через Context7

## Nuxt 4 Configuration

### nuxt.config.ts — Основной файл конфигурации

```typescript
export default defineNuxtConfig({
  // Дата совместимости для стабильных фич
  compatibilityDate: '2026-01-22',

  devtools: { enabled: true },

  // Модули (порядок важен)
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/supabase'
  ],

  // Глобальные CSS
  css: ['~/assets/css/main.css'],

  // Runtime конфигурация
  runtimeConfig: {
    // Приватные ключи (только сервер)
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,

    // Публичные ключи (клиент + сервер)
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY
    }
  },

  // Авто-импорт stores
  imports: {
    dirs: ['stores']
  },

  // Компоненты: отключаем pathPrefix для именования по файлу
  components: [
    { path: '~/components', pathPrefix: false }
  ]
})
```

### Авто-импорт директорий

```typescript
// Авто-импорт Pinia stores из ~/stores
export default defineNuxtConfig({
  imports: {
    dirs: ['stores']
  }
})
```

### Регистрация модулей

```typescript
// @pinia/nuxt для state management
export default defineNuxtConfig({
  modules: ['@pinia/nuxt']
})
```

---

## Vue 3 Composition API

### Базовый компонент с Script Setup

```vue
<script setup>
import { ref, onMounted } from 'vue'

// Реактивное состояние
const count = ref(0)

// Методы изменяющие состояние
function increment() {
  count.value++
}

// Lifecycle hooks
onMounted(() => {
  console.log(`Initial count: ${count.value}`)
})
</script>

<template>
  <button @click="increment">Count: {{ count }}</button>
</template>
```

### Computed свойства

```typescript
import { ref, computed } from 'vue'

const todos = ref([...])
const hideCompleted = ref(false)

// Computed автоматически реагирует на изменения зависимостей
const filteredTodos = computed(() => {
  return hideCompleted.value
    ? todos.value.filter(t => !t.completed)
    : todos.value
})
```

### Watch — отслеживание изменений

```vue
<script setup>
import { ref, watch } from 'vue'

const question = ref('')
const answer = ref('')
const loading = ref(false)

// watch работает напрямую с ref
watch(question, async (newQuestion) => {
  if (newQuestion.includes('?')) {
    loading.value = true
    try {
      const res = await fetch('https://api.example.com')
      answer.value = (await res.json()).answer
    } catch (error) {
      answer.value = 'Error: ' + error
    } finally {
      loading.value = false
    }
  }
})
</script>
```

### defineProps с TypeScript

```vue
<script setup lang="ts">
interface Book {
  title: string
  author: string
  year: number
}

const props = defineProps<{
  book: Book
}>()
</script>
```

### defineProps и defineEmits — Runtime Options

```vue
<script setup>
// Props с runtime валидацией
const props = defineProps({
  foo: String,
  bar: {
    type: Number,
    required: true
  }
})

// События компонента
const emit = defineEmits(['change', 'delete'])

// Использование
emit('change', newValue)
</script>
```

---

## Конвенции проекта pg19v3

### Именование компонентов

```
components/
├── ui/                    → Ui* префикс
│   ├── UiButton.vue
│   ├── UiCard.vue
│   └── UiInput.vue
├── admin/                 → Admin* префикс
│   ├── AdminSidebar.vue
│   └── AdminHeader.vue
└── users/                 → Users* префикс
    └── UsersTable.vue
```

**Правило:** Имя папки = префикс компонента

### Структура Script Setup (для страниц)

```typescript
// =============================================================================
// STORES & COMPOSABLES
// =============================================================================
const adminStore = useAdminAuthStore()

// =============================================================================
// DATA — асинхронная загрузка
// =============================================================================
const { data, pending } = await useFetch('/api/data')

// =============================================================================
// STATE — ref, reactive
// =============================================================================
const isLoading = ref(false)
const filters = reactive({ search: '', status: 'all' })

// =============================================================================
// COMPUTED
// =============================================================================
const filteredItems = computed(() => ...)

// =============================================================================
// METHODS
// =============================================================================
async function handleSubmit() { ... }

// =============================================================================
// LIFECYCLE
// =============================================================================
onMounted(() => { ... })

// =============================================================================
// WATCHERS
// =============================================================================
watch(filters, () => { ... }, { deep: true })
```

### Pinia Store шаблон

```typescript
import { defineStore } from 'pinia'

const STORAGE_KEY = 'pg19_admin'

interface AdminState {
  admin: Admin | null
  isAuthenticated: boolean
}

export const useAdminAuthStore = defineStore('adminAuth', {
  state: (): AdminState => ({
    admin: null,
    isAuthenticated: false
  }),

  getters: {
    isAdmin: (state) => state.admin?.role === 'admin',
    canManageUsers: (state) => state.admin?.permissions.includes('users:manage')
  },

  actions: {
    setAdmin(admin: Admin) {
      this.admin = admin
      this.isAuthenticated = true
    },

    clear() {
      this.admin = null
      this.isAuthenticated = false
    }
  },

  persist: {
    key: STORAGE_KEY,
    pick: ['admin', 'isAuthenticated']
  }
})
```

### CSS Variables (Dark Mode)

```css
:root {
  --bg-base: #ffffff;
  --text-primary: #111827;
  --glass-bg: rgba(255, 255, 255, 0.8);
}

.dark {
  --bg-base: #111827;
  --text-primary: #ffffff;
  --glass-bg: rgba(255, 255, 255, 0.03);
}
```

---

## Ключевые паттерны

1. **pathPrefix: false** — компоненты регистрируются по имени файла
2. **CSS переменные** — для theme switching
3. **Persist stores** — только нужные поля в localStorage
4. **Parallel data loading** — `Promise.all()` в composables
5. **Glass morphism** — `.glass-card` как основной UI паттерн
6. **Mobile-first** — `md:` prefix для desktop стилей
