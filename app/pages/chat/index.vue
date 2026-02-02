<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════════════
// ИМПОРТЫ ТИПОВ
// ═══════════════════════════════════════════════════════════════════════════
import type { Chat } from '~/types/admin'

// ═══════════════════════════════════════════════════════════════════════════
// ИМПОРТЫ
// ═══════════════════════════════════════════════════════════════════════════
import {
  CHAT_STATUS,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'

/** Фильтры статусов только для вкладки Поддержка: Ожидают, Активные, Закрытые, Все */
const CHAT_PAGE_STATUS_OPTIONS = [
  { value: 'waiting', label: 'Ожидают' },
  { value: 'active', label: 'Активные' },
  { value: 'closed', label: 'Закрытые' },
  { value: 'all', label: 'Все' },
]

/** Фильтры для списка чатов */
interface ChatFilters extends Record<string, unknown> {
  status: string
  assignedToMe: boolean
}

/** Варианты сортировки списка чатов */
const SORT_OPTIONS = [
  { value: 'lastMessage', label: 'По последнему сообщению' },
  { value: 'unread', label: 'Сначала непрочитанные' },
  { value: 'createdAt', label: 'По дате создания' },
] as const

type SortOption = (typeof SORT_OPTIONS)[number]['value']

const REFRESH_INTERVAL_MS = 30_000

// ═══════════════════════════════════════════════════════════════════════════
// МАКРОСЫ
// ═══════════════════════════════════════════════════════════════════════════
definePageMeta({
  middleware: 'admin',
})

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLES
// ═══════════════════════════════════════════════════════════════════════════
useHead({ title: 'Чаты поддержки — Админ-панель' })

const {
  items: chats,
  loading,
  filters,
  fetchItems,
} = useAdminList<Chat, ChatFilters>({
  endpoint: '/api/admin/chat',
  responseKey: 'chats',
  initialFilters: {
    status: 'waiting',
    assignedToMe: false,
  },
  transformParams: f => ({
    status: f.status === 'all' ? null : f.status,
    assignedToMe: f.assignedToMe ? 'true' : null,
  }),
})

// Клиентский поиск (по имени, контакту, теме, Telegram ID) — без запросов к API
const searchQuery = ref('')
const sortBy = ref<SortOption>('lastMessage')

// Навигация с клавиатуры
const listContainerRef = ref<HTMLElement | null>(null)
/** Индекс карточки с фокусом клавиатуры (-1 = подсветка никому не показывается) */
const focusedIndex = ref(-1)
const cardRefs = ref<(HTMLElement | null)[]>([])

// ═══════════════════════════════════════════════════════════════════════════
// COMPUTED
// ═══════════════════════════════════════════════════════════════════════════

/** Поисковая строка для сопоставления (нормализованная) */
function normalizeSearch(s: string): string {
  return s.trim().toLowerCase()
}

/** Проверяет, подходит ли чат под поисковый запрос */
function chatMatchesSearch(chat: Chat, query: string): boolean {
  if (!query) return true
  const q = normalizeSearch(query)
  const fields = [
    chat.userName,
    chat.guestName,
    chat.guestContact,
    chat.subject,
    chat.id,
    chat.userTelegramId != null ? String(chat.userTelegramId) : '',
  ].filter(Boolean) as string[]
  return fields.some(f => f.toLowerCase().includes(q))
}

/** Отсортированный по выбранному полю массив дат (для сравнения) */
function getSortKey(chat: Chat, option: SortOption): string | number {
  switch (option) {
    case 'unread':
      return `${chat.unreadAdminCount > 0 ? 0 : 1}-${chat.lastMessageAt || chat.createdAt}`
    case 'createdAt':
      return chat.createdAt
    default:
      return chat.lastMessageAt || chat.createdAt || ''
  }
}

/** Список чатов после поиска и сортировки (только фронтенд) */
const filteredAndSortedChats = computed(() => {
  const query = normalizeSearch(searchQuery.value)
  let list = query
    ? chats.value.filter(c => chatMatchesSearch(c, searchQuery.value))
    : [...chats.value]

  const option = sortBy.value
  if (option === 'unread') {
    list = [...list].sort((a, b) => {
      const unreadA = a.unreadAdminCount > 0 ? 1 : 0
      const unreadB = b.unreadAdminCount > 0 ? 1 : 0
      if (unreadB !== unreadA) return unreadB - unreadA
      const timeA = new Date(a.lastMessageAt || a.createdAt).getTime()
      const timeB = new Date(b.lastMessageAt || b.createdAt).getTime()
      return timeB - timeA
    })
  }
  else {
    list = [...list].sort((a, b) => {
      const keyA = getSortKey(a, option)
      const keyB = getSortKey(b, option)
      const tA = typeof keyA === 'string' ? new Date(keyA).getTime() : keyA
      const tB = typeof keyB === 'string' ? new Date(keyB).getTime() : keyB
      return tB - tA
    })
  }

  return list
})

/** Статистика для hero: всего диалогов и непрочитанных */
const chatStats = computed(() => {
  const list = chats.value
  const total = list.length
  const unread = list.reduce((acc, c) => acc + (c.unreadAdminCount || 0), 0)
  return { total, unread }
})

// ═══════════════════════════════════════════════════════════════════════════
// МЕТОДЫ
// ═══════════════════════════════════════════════════════════════════════════

/** Инициалы для аватарки чата */
function getChatInitials(chat: Chat): string {
  const name = chat.userName || chat.guestName || ''
  if (!name.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase().slice(0, 2)
  }
  return name.slice(0, 2).toUpperCase()
}

/** Переход на страницу чата */
function goToChat(id: string) {
  navigateTo(`/chat/${id}`)
}

/** Установить ref карточки по индексу (для скролла при навигации с клавиатурой) */
function setCardRef(i: number, el: unknown) {
  if (el) {
    const arr = cardRefs.value
    while (arr.length <= i) arr.push(null)
    const node = el && typeof el === 'object' && '$el' in el ? (el as { $el: HTMLElement }).$el : el
    arr[i] = node as HTMLElement
  }
}

/** Обработка клавиш в списке чатов */
function onListKeydown(e: KeyboardEvent) {
  const list = filteredAndSortedChats.value
  if (list.length === 0) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      focusedIndex.value = focusedIndex.value < 0 ? 0 : Math.min(focusedIndex.value + 1, list.length - 1)
      nextTick(() => cardRefs.value[focusedIndex.value]?.scrollIntoView({ block: 'nearest' }))
      break
    case 'ArrowUp':
      e.preventDefault()
      focusedIndex.value = focusedIndex.value < 0 ? list.length - 1 : Math.max(focusedIndex.value - 1, 0)
      nextTick(() => cardRefs.value[focusedIndex.value]?.scrollIntoView({ block: 'nearest' }))
      break
    case 'Enter':
      e.preventDefault()
      if (focusedIndex.value >= 0) {
        goToChat(list[focusedIndex.value]!.id)
      }
      break
    default:
      break
  }
}

/** Клик по карточке — синхронизируем индекс для клавиатуры */
function onCardClick(chat: Chat, index: number) {
  focusedIndex.value = index
  goToChat(chat.id)
}

// ═══════════════════════════════════════════════════════════════════════════
// АВТООБНОВЛЕНИЕ СПИСКА
// ═══════════════════════════════════════════════════════════════════════════

let refreshTimer: ReturnType<typeof setInterval> | null = null

function startRefreshTimer() {
  if (refreshTimer) return
  refreshTimer = setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      fetchItems()
    }
  }, REFRESH_INTERVAL_MS)
}

function stopRefreshTimer() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// Сбрасываем focusedIndex при смене списка (поиск/фильтр), -1 не трогаем
watch(filteredAndSortedChats, (list) => {
  if (focusedIndex.value >= 0) {
    focusedIndex.value = Math.min(focusedIndex.value, Math.max(0, list.length - 1))
  }
})

// Кнопка «Стрелка вверх»
const pageRootRef = ref<HTMLElement | null>(null)
const { showScrollTop, scrollToTop } = useScrollToTop(pageRootRef)

onMounted(() => {
  startRefreshTimer()
})

onUnmounted(() => {
  stopRefreshTimer()
})
</script>

<template>
  <div ref="pageRootRef" class="chat-page">
    <!-- Hero: градиент + заголовок + статистика -->
    <header class="chat-page__hero">
      <div class="chat-page__hero-bg" aria-hidden="true" />
      <div class="chat-page__hero-inner">
        <div class="flex items-center gap-3 mb-2">
          <div class="chat-page__hero-icon">
            <Icon name="heroicons:chat-bubble-left-right" class="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 class="chat-page__hero-title">
              Поддержка
            </h1>
            <p class="chat-page__hero-subtitle">
              Диалоги с клиентами в одном месте
            </p>
          </div>
        </div>
        <div v-if="!loading" class="chat-page__stats">
          <span class="chat-page__stat">
            <strong>{{ chatStats.total }}</strong> {{ chatStats.total === 1 ? 'диалог' : chatStats.total < 5 ? 'диалога' : 'диалогов' }}
          </span>
          <span v-if="chatStats.unread > 0" class="chat-page__stat chat-page__stat--unread">
            <span class="chat-page__stat-dot" />
            <strong>{{ chatStats.unread }}</strong> непрочитанных
          </span>
        </div>
      </div>
    </header>

    <!-- Панель фильтров и поиска -->
    <div class="chat-page__toolbar">
      <!-- Статусы: подчёркивание-табы -->
      <nav class="chat-page__nav" aria-label="Фильтр по статусу">
        <button
          v-for="opt in CHAT_PAGE_STATUS_OPTIONS"
          :key="opt.value"
          type="button"
          class="chat-page__nav-item"
          :class="{ 'chat-page__nav-item--active': filters.status === opt.value }"
          @click="filters.status = opt.value"
        >
          {{ opt.label }}
        </button>
      </nav>
      <!-- Поиск, сортировка и «Мои» — отдельные блоки -->
      <div class="chat-page__bar-row">
        <div class="chat-page__block chat-page__block--search">
          <Icon name="heroicons:magnifying-glass" class="chat-page__block-search-icon" aria-hidden="true" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Поиск..."
            class="chat-page__block-search"
            aria-label="Поиск чатов"
          />
        </div>
        <div class="chat-page__block chat-page__block--sort">
          <UiSelect
            v-model="sortBy"
            :options="SORT_OPTIONS.map(o => ({ value: o.value, label: o.label }))"
            placeholder="Сортировка"
            size="md"
            class="chat-page__block-sort"
          />
        </div>
        <button
          type="button"
          class="chat-page__block chat-page__block--mine"
          :class="{ 'chat-page__block--mine-on': filters.assignedToMe }"
          :title="filters.assignedToMe ? 'Показать все чаты' : 'Только мои'"
          aria-pressed="filters.assignedToMe"
          @click="filters.assignedToMe = !filters.assignedToMe"
        >
          <Icon name="heroicons:user" class="w-4 h-4" />
          <span>Мои</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <UiLoading v-if="loading" class="chat-page__loading" />

    <!-- Chat List (с навигацией с клавиатуры) -->
    <div
      v-else
      ref="listContainerRef"
      tabindex="0"
      role="list"
      aria-label="Список чатов"
      class="chat-page__list outline-none"
      @keydown="onListKeydown"
    >
      <article
        v-for="(chat, i) in filteredAndSortedChats"
        :key="chat.id"
        :ref="(el) => setCardRef(i, el)"
        class="chat-page__card"
        :class="{
          'chat-page__card--unread': chat.unreadAdminCount > 0,
          'chat-page__card--focused': i === focusedIndex,
        }"
        tabindex="-1"
        @click="onCardClick(chat, i)"
      >
        <div class="chat-page__card-avatar" :class="{ 'chat-page__card-avatar--unread': chat.unreadAdminCount > 0 }">
          <span>{{ getChatInitials(chat) }}</span>
          <span v-if="chat.unreadAdminCount > 0" class="chat-page__card-badge">
            {{ chat.unreadAdminCount > 9 ? '9+' : chat.unreadAdminCount }}
          </span>
        </div>
        <div class="chat-page__card-body">
          <div class="chat-page__card-top">
            <span class="chat-page__card-name" :class="{ 'font-semibold': chat.unreadAdminCount > 0 }">
              {{ chat.userName || chat.guestName || `Чат #${chat.id.slice(0, 8)}` }}
            </span>
            <span class="chat-page__card-time">
              <UiRelativeTime :date="chat.lastMessageAt" />
            </span>
          </div>
          <p v-if="chat.subject" class="chat-page__card-subject">
            {{ chat.subject }}
          </p>
          <div class="chat-page__card-meta">
            <UiBadge
              v-if="chat.guestName && !chat.userId"
              size="sm"
              class="chat-page__card-guest"
            >
              Гость
            </UiBadge>
            <UiBadge
              :class="getStatusBadgeClass(CHAT_STATUS, chat.status)"
              size="sm"
            >
              {{ getStatusLabel(CHAT_STATUS, chat.status) }}
            </UiBadge>
            <span v-if="chat.assignedAdmin" class="chat-page__card-assigned">
              <Icon name="heroicons:user-circle" class="w-3.5 h-3.5" />
              {{ chat.assignedAdmin.fullName }}
            </span>
          </div>
        </div>
        <Icon name="heroicons:chevron-right" class="chat-page__card-arrow" />
      </article>

      <!-- Empty state -->
      <div
        v-if="filteredAndSortedChats.length === 0"
        class="chat-page__empty"
      >
        <div class="chat-page__empty-icon">
          <Icon name="heroicons:chat-bubble-left-right" class="w-16 h-16 text-[var(--text-muted)]/40" />
        </div>
        <h2 class="chat-page__empty-title">
          {{ searchQuery.trim() ? 'Ничего не найдено' : (filters.status === 'all' ? 'Пока нет диалогов' : 'Нет чатов с этим статусом') }}
        </h2>
        <p class="chat-page__empty-text">
          {{ searchQuery.trim() ? 'Попробуйте другой запрос или сбросьте фильтры' : 'Новые обращения появятся здесь' }}
        </p>
      </div>
    </div>

    <Transition name="chat-page-scroll-top">
      <button
        v-if="showScrollTop"
        type="button"
        class="chat-page__scroll-top"
        aria-label="Прокрутить вверх"
        @click="scrollToTop"
      >
        <Icon name="heroicons:arrow-up" class="w-5 h-5" />
      </button>
    </Transition>
  </div>
</template>
