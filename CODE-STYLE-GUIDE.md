# Правила оформления кода Vue + Nuxt

Правила оформления кода. Минимализм, читаемость, никакого мусора.

## Best Practices — Чистый код

### Пиши коротко и понятно

```typescript
// ❌ Плохо — слишком многословно
const isUserActive = computed(() => {
  if (user.value.status === 'active') {
    return true
  } else {
    return false
  }
})

// ✅ Хорошо — одна строка, тот же смысл
const isUserActive = computed(() => user.value.status === 'active')
```

### Называй так, чтобы было понятно без комментария

```typescript
// ❌ Плохо — непонятно что это
const d = users.filter(u => u.s === 'a')

// ✅ Хорошо — сразу ясно
const activeUsers = users.filter(user => user.status === 'active')
```

### Выходи из функции рано (guard clauses)

```typescript
// ❌ Плохо — много вложенности, трудно читать
function processUser(user) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        // основная логика глубоко внутри
      }
    }
  }
}

// ✅ Хорошо — проверки в начале, логика внизу
function processUser(user) {
  if (!user) return // Нет пользователя — выходим
  if (!user.isActive) return // Неактивен — выходим
  if (!user.hasPermission) return // Нет прав — выходим

  // Основная логика — легко читать
}
```

### Используй деструктуризацию

```typescript
// ❌ Плохо — повторяем props.user много раз
const userName = props.user.name
const userEmail = props.user.email
const userRole = props.user.role

// ✅ Хорошо — вытаскиваем всё сразу
const { name, email, role } = props.user
```

### Удаляй мёртвый код

```typescript
// ❌ Плохо — закомментированный код засоряет файл
// function oldImplementation() { ... }
// const unusedVariable = 'test'

// ✅ Хорошо — Git помнит историю, удаляй смело
```

### Один файл — одна задача

```typescript
// ❌ Плохо — всё свалено в один файл
// utils/helpers.ts — 500 строк всего подряд

// ✅ Хорошо — каждая функция в своём файле
// utils/formatDate.ts — форматирование даты
// utils/validateEmail.ts — проверка email
// utils/parseQuery.ts — парсинг URL параметров
```

---

## Комментарии

### Всегда комментируй на русском

```typescript
const users = ref<User[]>([]) // Список пользователей
const isLoading = ref(false) // Идёт ли загрузка
const error = ref<string | null>(null) // Текст ошибки (если есть)

// Загружаем пользователей с сервера
async function fetchUsers() {
  isLoading.value = true // Включаем индикатор загрузки
  try {
    const { data } = await supabase.from('users').select('*')
    users.value = data ?? [] // Сохраняем результат (или пустой массив)
  } catch (err) {
    error.value = 'Не удалось загрузить пользователей' // Сохраняем ошибку
  } finally {
    isLoading.value = false // Выключаем индикатор в любом случае
  }
}
```

### Объясняй неочевидное

```typescript
// Задержка 1 секунда — API имеет лимит 60 запросов в минуту
await sleep(1000)

// ВАЖНО: Supabase возвращает null если запись не найдена, а не ошибку
const { data } = await supabase.from('users').single()

// TODO: Добавить пагинацию когда будет больше 100 записей
```

## 1. Именование файлов

### Компоненты (Components)

**Компонент** — переиспользуемый блок интерфейса (кнопка, карточка, форма).

**Правила:**
- **PascalCase** — каждое слово с большой буквы: `UserProfile`, не `userProfile`
- **Минимум 2 слова** — избегаем конфликтов с HTML тегами (`<button>`, `<header>`)
- **Префиксы для базовых компонентов:**
  - `Ui` — базовые UI элементы: `UiButton`, `UiInput`, `UiModal`
  - `App` — компоненты уровня приложения: `AppHeader`, `AppFooter`
  - `The` — единственные на странице: `TheNavbar`, `TheSidebar`

### Composables (Композиции / Хуки)

**Composable** — переиспользуемая логика с реактивным состоянием.

**Правила:**
- **Префикс `use`** — обязателен, это соглашение Vue
- **camelCase** — `useAuth`, не `use-auth`
- **Глагол для действий** — `useCreatePost`, `useFetchData`, `useDeleteUser`

### Утилиты (Utils)

**Утилита** — чистая функция без состояния (форматирование, валидация).

**Правила:**
- **camelCase** — `formatDate.ts`
- **Глагол + существительное** — `formatDate`, `validateEmail`, `parseQuery`
- **Один файл = одна функция** (или группа тесно связанных)

---

## 2. Структура Vue компонента

Порядок секций в `.vue` файле и порядок кода внутри `<script setup>`.

### Порядок блоков в файле

```vue
<!-- 1. SCRIPT — всегда первый -->
<script setup lang="ts">
// Логика компонента
</script>

<!-- 2. TEMPLATE — второй -->
<template>
  <!-- Разметка -->
</template>

<!-- 3. STYLE — последний -->
<style scoped>
/* Стили */
</style>
```

### Порядок кода внутри `<script setup>`

```vue
<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════════════
// 1. ИМПОРТЫ ТИПОВ (Type Imports)
// ═══════════════════════════════════════════════════════════════════════════
// Импортируем только типы для TypeScript.
// Используем `import type` — это удаляется при сборке.

import type { User, UserRole } from '~/types'
import type { Database } from '~/types/supabase'

// ═══════════════════════════════════════════════════════════════════════════
// 2. МАКРОСЫ ВРЕМЕНИ КОМПИЛЯЦИИ (Compile-time Macros)
// ═══════════════════════════════════════════════════════════════════════════
// Эти функции выполняются при СБОРКЕ, не в браузере.
// Nuxt использует их для генерации роутов, middleware и т.д.

// definePageMeta — настройки страницы (только в pages/*.vue)
definePageMeta({
  middleware: 'auth',       // Middleware для защиты роута
  layout: 'dashboard',      // Какой layout использовать
  title: 'Пользователи',    // Заголовок страницы
  pageTransition: {         // Анимация перехода
    name: 'fade',
    mode: 'out-in',
  },
})

// defineOptions — настройки компонента (имя, inheritAttrs)
defineOptions({
  name: 'UserProfilePage',  // Имя для DevTools
  inheritAttrs: false,      // Не наследовать атрибуты автоматически
})

// ═══════════════════════════════════════════════════════════════════════════
// 3. PROPS — ВХОДНЫЕ ПАРАМЕТРЫ
// ═══════════════════════════════════════════════════════════════════════════
// Props — данные, которые РОДИТЕЛЬ передаёт РЕБЁНКУ.
// Ребёнок НЕ МОЖЕТ изменять props напрямую!

interface Props {
  /** ID пользователя для загрузки (обязательный) */
  userId: string

  /** Показывать аватар? (опциональный, по умолчанию true) */
  showAvatar?: boolean

  /** Размер карточки (опциональный, по умолчанию 'md') */
  size?: 'sm' | 'md' | 'lg'

  /** Данные пользователя, если уже загружены */
  initialData?: User | null
}

// withDefaults — задаёт значения по умолчанию для опциональных props
const props = withDefaults(defineProps<Props>(), {
  showAvatar: true,
  size: 'md',
  initialData: null,
})

// ═══════════════════════════════════════════════════════════════════════════
// 4. EMITS — СОБЫТИЯ (от ребёнка к родителю)
// ═══════════════════════════════════════════════════════════════════════════
// Emits — способ РЕБЁНКА сообщить РОДИТЕЛЮ о чём-то.
// Родитель слушает события через @event-name="handler"

const emit = defineEmits<{
  /** Пользователь обновлён — передаём новые данные */
  update: [user: User]

  /** Пользователь удалён — передаём ID */
  delete: [userId: string]

  /** Модалка закрыта — без аргументов */
  close: []

  /** Ошибка — передаём сообщение */
  error: [message: string]
}>()

// Как вызывать:
// emit('update', updatedUser)
// emit('delete', '123')
// emit('close')

// ═══════════════════════════════════════════════════════════════════════════
// 5. COMPOSABLES — ПЕРЕИСПОЛЬЗУЕМАЯ ЛОГИКА
// ═══════════════════════════════════════════════════════════════════════════
// Composables — функции, которые возвращают реактивное состояние.
// Вызываются в начале setup, результат сохраняется в переменные.

// Встроенные Nuxt composables
const route = useRoute()           // Текущий роут (путь, параметры, query)
const router = useRouter()         // Навигация (push, replace, back)
const config = useRuntimeConfig()  // Конфигурация из nuxt.config.ts

// Supabase composables (@nuxtjs/supabase)
const supabase = useSupabaseClient<Database>()  // Клиент Supabase
const user = useSupabaseUser()                   // Текущий пользователь

// Кастомные composables проекта
const { showSuccess, showError } = useToast()   // Уведомления
const { isOnline } = useNetwork()               // Состояние сети

// Загрузка данных с SSR поддержкой
const {
  data: userData,      // Реактивные данные (Ref<User | null>)
  pending: isLoading,  // Идёт загрузка? (Ref<boolean>)
  error,               // Ошибка (Ref<Error | null>)
  refresh,             // Функция перезагрузки
} = await useAsyncData(
  `user-${props.userId}`,  // Уникальный ключ для кеширования
  () => fetchUser(props.userId),
  {
    watch: [() => props.userId],  // Перезагружать при изменении userId
    lazy: false,                   // Загружать сразу (не лениво)
  }
)

// ═══════════════════════════════════════════════════════════════════════════
// 6. РЕАКТИВНОЕ СОСТОЯНИЕ (Reactive State)
// ═══════════════════════════════════════════════════════════════════════════
// Состояние компонента — данные, которые могут меняться.
// При изменении Vue автоматически обновляет DOM.

// ref() — для примитивов и простых значений
// Доступ к значению: переменная.value (в script), переменная (в template)
const isModalOpen = ref(false)           // boolean
const searchQuery = ref('')              // string
const selectedIds = ref<string[]>([])    // массив
const currentPage = ref(1)               // number

// reactive() — для объектов (без .value)
// Используйте когда нужен объект с несколькими связанными полями
const filters = reactive({
  search: '',
  role: '' as UserRole | '',
  status: 'active' as 'active' | 'inactive' | '',
  sortBy: 'created_at',
  sortOrder: 'desc' as 'asc' | 'desc',
})

const formData = reactive({
  email: '',
  fullName: '',
  role: 'user' as UserRole,
})

// ═══════════════════════════════════════════════════════════════════════════
// 7. COMPUTED — ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
// ═══════════════════════════════════════════════════════════════════════════
// Computed — значение, которое АВТОМАТИЧЕСКИ пересчитывается
// при изменении зависимостей. Результат КЕШИРУЕТСЯ.

// Простой computed
const fullName = computed(() => {
  return `${formData.firstName} ${formData.lastName}`
})

// Computed с условием
const isFormValid = computed(() => {
  return formData.email.includes('@') && formData.fullName.length > 2
})

// Computed для фильтрации
const activeUsers = computed(() => {
  return users.value.filter(user => user.status === 'active')
})

// Computed с геттером и сеттером (редко нужен)
const selectedUser = computed({
  get: () => users.value.find(u => u.id === selectedId.value),
  set: (user) => { selectedId.value = user?.id ?? '' },
})

// ═══════════════════════════════════════════════════════════════════════════
// 8. МЕТОДЫ — ФУНКЦИИ КОМПОНЕНТА
// ═══════════════════════════════════════════════════════════════════════════
// Обычные функции для обработки событий и логики.
// Используйте function declaration, не arrow functions (лучше читаемость).

/** Открыть модалку создания */
function openCreateModal() {
  // Сбросить форму
  Object.assign(formData, { email: '', fullName: '', role: 'user' })
  isModalOpen.value = true
}

/** Открыть модалку редактирования */
function openEditModal(user: User) {
  Object.assign(formData, {
    email: user.email,
    fullName: user.full_name,
    role: user.role,
  })
  editingUserId.value = user.id
  isModalOpen.value = true
}

/** Сохранить пользователя (создание или обновление) */
async function saveUser() {
  try {
    if (editingUserId.value) {
      // Обновление существующего
      await updateUser(editingUserId.value, formData)
      showSuccess('Пользователь обновлён')
      emit('update', { ...formData, id: editingUserId.value })
    } else {
      // Создание нового
      const newUser = await createUser(formData)
      showSuccess('Пользователь создан')
      emit('update', newUser)
    }
    isModalOpen.value = false
  } catch (err) {
    showError(`Ошибка: ${(err as Error).message}`)
    emit('error', (err as Error).message)
  }
}

/** Удалить пользователя */
async function deleteUser(user: User) {
  if (!confirm(`Удалить ${user.email}?`)) return

  try {
    await supabase.from('users').delete().eq('id', user.id)
    showSuccess('Пользователь удалён')
    emit('delete', user.id)
    await refresh()
  } catch (err) {
    showError('Ошибка удаления')
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. WATCH — НАБЛЮДАТЕЛИ
// ═══════════════════════════════════════════════════════════════════════════
// Watch — выполняет код при ИЗМЕНЕНИИ значения.
// Используйте для side effects: API вызовы, localStorage, аналитика.

// Следить за ref
watch(searchQuery, (newValue, oldValue) => {
  console.log(`Поиск изменился: ${oldValue} → ${newValue}`)
  // Сбросить на первую страницу при новом поиске
  currentPage.value = 1
})

// Следить за вложенным свойством reactive объекта
watch(
  () => filters.role,
  (newRole) => {
    console.log(`Фильтр роли: ${newRole}`)
  }
)

// Следить за несколькими значениями
watch(
  [currentPage, () => filters.sortBy],
  ([page, sortBy]) => {
    console.log(`Страница ${page}, сортировка ${sortBy}`)
    refresh()
  }
)

// Следить с опциями
watch(
  () => props.userId,
  async (newId) => {
    await refresh()
  },
  {
    immediate: true,  // Выполнить сразу при создании компонента
    deep: false,      // Глубокое наблюдение (для объектов)
  }
)

// watchEffect — автоматически отслеживает все зависимости
watchEffect(() => {
  // Этот код выполнится при изменении ЛЮБОЙ переменной внутри
  console.log(`User: ${props.userId}, Page: ${currentPage.value}`)
})

// ═══════════════════════════════════════════════════════════════════════════
// 10. LIFECYCLE HOOKS — ХУКИ ЖИЗНЕННОГО ЦИКЛА
// ═══════════════════════════════════════════════════════════════════════════
// Lifecycle hooks — функции, вызываемые на определённых этапах жизни компонента.

// onMounted — компонент ДОБАВЛЕН в DOM (только на клиенте!)
// Используйте для: DOM манипуляций, подписок, инициализации библиотек
onMounted(() => {
  console.log('Компонент смонтирован')

  // Пример: фокус на инпуте
  inputRef.value?.focus()

  // Пример: подписка на события окна
  window.addEventListener('resize', handleResize)
})

// onUnmounted — компонент УДАЛЯЕТСЯ из DOM
// Используйте для: отписки, очистки таймеров, закрытия соединений
onUnmounted(() => {
  console.log('Компонент размонтирован')

  // ВАЖНО: всегда очищайте подписки!
  window.removeEventListener('resize', handleResize)
})

// onBeforeMount — перед добавлением в DOM
onBeforeMount(() => {
  console.log('Перед монтированием')
})

// onBeforeUnmount — перед удалением из DOM
onBeforeUnmount(() => {
  console.log('Перед размонтированием')
})

// onUpdated — после обновления DOM (при изменении реактивных данных)
onUpdated(() => {
  console.log('DOM обновлён')
})

// ═══════════════════════════════════════════════════════════════════════════
// 11. PROVIDE / INJECT (передача данных через уровни)
// ═══════════════════════════════════════════════════════════════════════════
// Если нужно передать данные глубоко вниз без "prop drilling"

// В родителе:
provide('theme', theme)
provide('currentUser', user)

// В любом потомке (на любой глубине):
const theme = inject('theme')
const currentUser = inject('currentUser')

// ═══════════════════════════════════════════════════════════════════════════
// 12. EXPOSE (что доступно родителю через ref)
// ═══════════════════════════════════════════════════════════════════════════
// По умолчанию в <script setup> ничего не доступно снаружи.
// defineExpose явно указывает, что можно вызвать через ref.

defineExpose({
  refresh,      // Родитель может вызвать: componentRef.value.refresh()
  resetForm,
  isFormValid,
})
</script>
```

---

## 3. Порядок атрибутов в шаблоне

Единообразный порядок атрибутов улучшает читаемость.

```vue
<MyComponent
  v-if="isVisible"           <!-- 1. Директивы условий (v-if, v-else, v-show) -->
  v-for="item in items"      <!-- 2. Директивы циклов (v-for) -->
  :key="item.id"             <!-- 3. Key (обязателен с v-for!) -->
  ref="componentRef"         <!-- 4. Ref (ссылка на элемент/компонент) -->
  v-model="inputValue"       <!-- 5. v-model (двусторонняя привязка) -->
  :user-id="userId"          <!-- 6. Props (v-bind, передача данных вниз) -->
  :is-loading="loading"
  @update="handleUpdate"     <!-- 7. Events (v-on, обработка событий) -->
  @close="handleClose"
  class="card card--large"   <!-- 8. Class и Style -->
  :class="{ 'is-active': isActive }"
/>
```

### Таблица приоритетов

| # | Атрибуты | Описание |
|---|----------|----------|
| 1 | `v-if`, `v-else-if`, `v-else`, `v-show` | Условный рендеринг |
| 2 | `v-for` | Циклы |
| 3 | `:key` | Уникальный идентификатор для v-for |
| 4 | `ref` | Ссылка на элемент |
| 5 | `v-model` | Двусторонняя привязка |
| 6 | `:prop` (v-bind) | Передача данных в компонент |
| 7 | `@event` (v-on) | Обработчики событий |
| 8 | `class`, `style` | Стилизация |

---

## 4. Props (Входные параметры)

**Props** — данные, которые родительский компонент передаёт дочернему.

### Определение с TypeScript (рекомендуемый способ)

```typescript
// Определяем интерфейс с документацией
interface Props {
  /**
   * ID пользователя для загрузки
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  userId: string

  /**
   * Показывать аватар пользователя?
   * @default true
   */
  showAvatar?: boolean

  /**
   * Размер карточки
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Предзагруженные данные (если есть)
   */
  initialData?: User | null
}

// defineProps + withDefaults для значений по умолчанию
const props = withDefaults(defineProps<Props>(), {
  showAvatar: true,
  size: 'md',
  initialData: null,
})

// Использование в script
console.log(props.userId)      // string
console.log(props.showAvatar)  // boolean (true если не передан)
```

### Использование в родителе

```vue
<template>
  <!-- Статическое значение -->
  <UserCard user-id="123" />

  <!-- Динамическое значение (с :) -->
  <UserCard :user-id="selectedUserId" />

  <!-- Булевы props -->
  <UserCard :user-id="id" show-avatar />        <!-- true -->
  <UserCard :user-id="id" :show-avatar="false" /> <!-- false -->

  <!-- Передача объекта -->
  <UserCard :user-id="id" :initial-data="userData" />
</template>
```

### Важные правила

| Правило | Пример |
|---------|--------|
| Props — только для чтения | ❌ `props.userId = '456'` |
| kebab-case в шаблоне | ✅ `:user-id` (не `:userId`) |
| camelCase в script | ✅ `props.userId` |
| Валидация типов | TypeScript проверит при сборке |

---

## 5. Emits (События)

**Emits** — способ дочернего компонента сообщить родителю о чём-либо.

### Определение с TypeScript

```typescript
const emit = defineEmits<{
  /**
   * Данные формы обновлены
   * @param user - Обновлённые данные пользователя
   */
  update: [user: User]

  /**
   * Запрос на удаление
   * @param id - ID пользователя
   * @param confirmed - Подтверждено ли удаление
   */
  delete: [id: string, confirmed: boolean]

  /**
   * Модалка закрыта (без данных)
   */
  close: []

  /**
   * Произошла ошибка
   * @param message - Текст ошибки
   */
  error: [message: string]
}>()
```

### Вызов событий

```typescript
// С одним аргументом
emit('update', updatedUser)

// С несколькими аргументами
emit('delete', userId, true)

// Без аргументов
emit('close')

// В обработчике ошибок
catch (err) {
  emit('error', (err as Error).message)
}
```

### Обработка в родителе

```vue
<template>
  <UserForm
    :user="selectedUser"
    @update="handleUserUpdate"
    @delete="handleUserDelete"
    @close="isModalOpen = false"
    @error="showErrorToast"
  />
</template>

<script setup lang="ts">
function handleUserUpdate(user: User) {
  console.log('Пользователь обновлён:', user)
  users.value = users.value.map(u => u.id === user.id ? user : u)
}

function handleUserDelete(id: string, confirmed: boolean) {
  if (confirmed) {
    users.value = users.value.filter(u => u.id !== id)
  }
}

function showErrorToast(message: string) {
  toast.error(message)
}
</script>
```

---

## 6. Composables (Композиции)

**Composable** — функция, инкапсулирующая реактивную логику для переиспользования.

### Структура composable

```typescript
// composables/useCounter.ts

import { ref, computed, readonly } from 'vue'

/**
 * Счётчик с инкрементом, декрементом и сбросом.
 *
 * @param initialValue - Начальное значение (по умолчанию 0)
 * @returns Объект с состоянием и методами
 *
 * @example
 * const { count, increment, decrement, reset } = useCounter(10)
 * increment() // count.value === 11
 */
export function useCounter(initialValue = 0) {
  // Приватное состояние
  const count = ref(initialValue)

  // Вычисляемые свойства
  const isPositive = computed(() => count.value > 0)
  const isNegative = computed(() => count.value < 0)
  const isZero = computed(() => count.value === 0)

  // Методы
  function increment(step = 1) {
    count.value += step
  }

  function decrement(step = 1) {
    count.value -= step
  }

  function reset() {
    count.value = initialValue
  }

  function set(value: number) {
    count.value = value
  }

  // Возвращаем публичный API
  return {
    // Состояние (readonly чтобы нельзя было изменить снаружи напрямую)
    count: readonly(count),
    isPositive,
    isNegative,
    isZero,

    // Методы
    increment,
    decrement,
    reset,
    set,
  }
}
```

### Использование в компоненте

```vue
<script setup lang="ts">
// Composable автоматически импортируется в Nuxt
const { count, increment, decrement, reset, isPositive } = useCounter(0)
</script>

<template>
  <div>
    <p>Счётчик: {{ count }}</p>
    <p v-if="isPositive">Положительное число!</p>

    <button @click="decrement()">-1</button>
    <button @click="increment()">+1</button>
    <button @click="increment(10)">+10</button>
    <button @click="reset()">Сброс</button>
  </div>
</template>
```

### Composable с async/await

```typescript
// composables/useFetchUsers.ts

export function useFetchUsers() {
  const users = ref<User[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  async function fetchUsers(params?: { role?: string }) {
    isLoading.value = true
    error.value = null

    try {
      const supabase = useSupabaseClient()
      let query = supabase.from('users').select('*')

      if (params?.role) {
        query = query.eq('role', params.role)
      }

      const { data, error: err } = await query
      if (err) throw err

      users.value = data
    } catch (err) {
      error.value = err as Error
    } finally {
      isLoading.value = false
    }
  }

  // Загрузить при создании
  onMounted(() => {
    fetchUsers()
  })

  return {
    users: readonly(users),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchUsers,
    refresh: fetchUsers,
  }
}
```

---

## 7. Реактивность

### ref() vs reactive()

| | `ref()` | `reactive()` |
|-|---------|--------------|
| **Для чего** | Примитивы, простые значения | Объекты с несколькими полями |
| **Доступ** | `.value` в script | Напрямую (без .value) |
| **В template** | Автоматически unwrap | Напрямую |
| **Переназначение** | ✅ `ref.value = newValue` | ❌ Нельзя переназначить |

```typescript
// ref — для примитивов
const count = ref(0)
const name = ref('John')
const isOpen = ref(false)
const items = ref<string[]>([])

count.value++           // В script нужен .value
name.value = 'Jane'

// reactive — для объектов
const user = reactive({
  name: 'John',
  email: 'john@example.com',
  age: 25,
})

user.name = 'Jane'      // Без .value
user.age++

// ❌ Нельзя переназначить reactive целиком
// user = { name: 'Bob' }  // Ошибка!

// ✅ Используйте Object.assign для обновления
Object.assign(user, { name: 'Bob', email: 'bob@example.com' })
```

### computed()

```typescript
// Только геттер (чаще всего)
const fullName = computed(() => `${user.firstName} ${user.lastName}`)

// С геттером и сеттером (редко)
const fullName = computed({
  get: () => `${user.firstName} ${user.lastName}`,
  set: (value) => {
    const [first, last] = value.split(' ')
    user.firstName = first
    user.lastName = last
  },
})

fullName.value = 'John Doe' // Вызовет сеттер
```

### watch() vs watchEffect()

```typescript
// watch — явно указываем что наблюдаем
watch(count, (newValue, oldValue) => {
  console.log(`Было ${oldValue}, стало ${newValue}`)
})

// watch с опциями
watch(
  () => props.userId,
  async (newId) => {
    await fetchUser(newId)
  },
  {
    immediate: true,  // Выполнить сразу
    deep: true,       // Глубокое наблюдение объектов
  }
)

// watchEffect — автоматически отслеживает зависимости
watchEffect(() => {
  // Выполнится при изменении count ИЛИ name
  console.log(`Count: ${count.value}, Name: ${name.value}`)
})
```

---

## 8. Директивы в шаблоне

### v-if vs v-show

```vue
<!-- v-if: УДАЛЯЕТ элемент из DOM -->
<!-- Используйте когда: условие редко меняется, тяжёлый компонент -->
<HeavyComponent v-if="isVisible" />

<!-- v-show: СКРЫВАЕТ через CSS (display: none) -->
<!-- Используйте когда: часто переключается, лёгкий компонент -->
<Dropdown v-show="isOpen" />
```

| | `v-if` | `v-show` |
|-|--------|----------|
| Как работает | Удаляет из DOM | `display: none` |
| Начальная цена | Дешевле если false | Всегда рендерит |
| Цена переключения | Дороже (создаёт/удаляет) | Дешевле (меняет CSS) |
| Когда использовать | Редко меняется | Часто меняется |

### v-for (всегда с :key!)

```vue
<!-- ✅ ПРАВИЛЬНО: уникальный ID как key -->
<div v-for="user in users" :key="user.id">
  {{ user.name }}
</div>

<!-- ❌ НЕПРАВИЛЬНО: индекс как key (проблемы при сортировке/удалении) -->
<div v-for="(user, index) in users" :key="index">
  {{ user.name }}
</div>

<!-- ✅ Деструктуризация в v-for -->
<div v-for="{ id, name, email } in users" :key="id">
  {{ name }} ({{ email }})
</div>

<!-- ✅ С индексом когда нужен -->
<div v-for="(user, index) in users" :key="user.id">
  {{ index + 1 }}. {{ user.name }}
</div>
```

### v-if + v-for (НИКОГДА вместе на одном элементе!)

```vue
<!-- ❌ НЕПРАВИЛЬНО: v-if и v-for на одном элементе -->
<li v-for="user in users" v-if="user.isActive" :key="user.id">
  {{ user.name }}
</li>

<!-- ✅ ПРАВИЛЬНО: computed свойство -->
<li v-for="user in activeUsers" :key="user.id">
  {{ user.name }}
</li>

<script setup>
const activeUsers = computed(() => users.value.filter(u => u.isActive))
</script>

<!-- ✅ ПРАВИЛЬНО: template wrapper -->
<template v-for="user in users" :key="user.id">
  <li v-if="user.isActive">
    {{ user.name }}
  </li>
</template>
```

---

## 9. Форматирование кода

### Настройки ESLint Stylistic

| Параметр | Значение | Пример |
|----------|----------|--------|
| Отступы | 2 пробела | `··const x = 1` |
| Кавычки | Одинарные | `'строка'` |
| Точка с запятой | Без | `const x = 1` (не `const x = 1;`) |
| Запятая в конце | Да | `{ a: 1, b: 2, }` |
| Длина строки | 100 символов | Переносить если длиннее |



## 10. Что избегать

| ❌ Избегать | ✅ Использовать | Почему |
|-------------|-----------------|--------|
| `var` | `const` / `let` | `var` имеет проблемы со scope |
| `==` | `===` | `==` делает неявное приведение типов |
| `this` | Не нужен в Composition API | В `<script setup>` нет `this` |
| Options API | Composition API | Современный стандарт |
| Mixins | Composables | Лучше типизация и отладка |
| Мутация props | `emit()` | Props — только для чтения |
| `v-for` без `:key` | Всегда с `:key` | Vue не сможет оптимизировать |
| Magic strings | Константы / enums | Легче рефакторить |
| `any` | Конкретные типы | Теряется смысл TypeScript |
| `// @ts-ignore` | Исправить тип | Скрывает реальные проблемы |

### JSDoc для функций

```typescript
/**
 * Форматирует дату в читаемый вид.
 *
 * @param date - Дата в ISO формате или объект Date
 * @param locale - Локаль для форматирования
 * @returns Отформатированная строка
 *
 * @example
 * formatDate('2024-01-15T10:30:00Z')
 * // => '15 янв. 2024'
 *
 * @example
 * formatDate(new Date(), 'en-US')
 * // => 'Jan 15, 2024'
 */
export function formatDate(
  date: string | Date | null,
  locale = 'ru-RU'
): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}