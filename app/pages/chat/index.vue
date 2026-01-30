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
  CHAT_STATUS_OPTIONS,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'

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
const focusedIndex = ref(0)
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

// ═══════════════════════════════════════════════════════════════════════════
// МЕТОДЫ
// ═══════════════════════════════════════════════════════════════════════════

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
      focusedIndex.value = Math.min(focusedIndex.value + 1, list.length - 1)
      nextTick(() => cardRefs.value[focusedIndex.value]?.scrollIntoView({ block: 'nearest' }))
      break
    case 'ArrowUp':
      e.preventDefault()
      focusedIndex.value = Math.max(focusedIndex.value - 1, 0)
      nextTick(() => cardRefs.value[focusedIndex.value]?.scrollIntoView({ block: 'nearest' }))
      break
    case 'Enter':
      e.preventDefault()
      goToChat(list[focusedIndex.value]!.id)
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

// Сбрасываем focusedIndex при смене списка (поиск/фильтр)
watch(filteredAndSortedChats, (list) => {
  focusedIndex.value = Math.min(focusedIndex.value, Math.max(0, list.length - 1))
})

onMounted(() => {
  startRefreshTimer()
})

onUnmounted(() => {
  stopRefreshTimer()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <h1 class="text-3xl font-bold text-[var(--text-primary)]">
        Чаты поддержки
      </h1>
    </div>

    <!-- Filters + поиск + сортировка -->
    <div class="flex flex-col gap-4 mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <UiFilterTabs v-model="filters.status" :options="CHAT_STATUS_OPTIONS" />
        <div class="flex items-center gap-2 ml-auto">
          <input
            id="showMine"
            v-model="filters.assignedToMe"
            type="checkbox"
            class="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary"
          />
          <label for="showMine" class="text-sm text-[var(--text-secondary)] cursor-pointer">
            Только мои
          </label>
        </div>
      </div>

      <div class="flex flex-nowrap items-center gap-3">
        <div class="w-64 min-w-0 flex-1">
          <UiSelect
            v-model="sortBy"
            :options="SORT_OPTIONS.map(o => ({ value: o.value, label: o.label }))"
            placeholder="Сортировка"
            size="md"
            class="w-full"
          />
        </div>
        <div class="w-64 min-w-0 flex-1">
          <UiInput
            v-model="searchQuery"
            type="search"
            placeholder="Поиск.."
            class="w-full"
          />
        </div>
      </div>
    </div>

    <!-- Loading -->
    <UiLoading v-if="loading" />

    <!-- Chat List (с навигацией с клавиатуры) -->
    <div
      v-else
      ref="listContainerRef"
      tabindex="0"
      role="list"
      aria-label="Список чатов"
      class="outline-none focus:outline-none space-y-3"
      @keydown="onListKeydown"
    >
      <UiCard
        v-for="(chat, i) in filteredAndSortedChats"
        :key="chat.id"
        :ref="(el) => setCardRef(i, el)"
        :hover="true"
        padding="sm"
        class="cursor-pointer transition-ring focus-within:ring-2 focus-within:ring-primary/30 focus-within:ring-offset-2 focus-within:ring-offset-[var(--bg-primary)]"
        :class="{ 'ring-2 ring-primary/40 ring-offset-2 ring-offset-[var(--bg-primary)]': i === focusedIndex }"
        tabindex="-1"
        @click="onCardClick(chat, i)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="font-medium text-[var(--text-primary)]">
                {{ chat.userName || `Чат #${chat.id}` }}
              </span>
              <span
                v-if="chat.guestContact"
                class="text-xs text-[var(--text-muted)]"
              >
                ({{ chat.guestContact }})
              </span>
              <UiBadge
                v-if="chat.guestName && !chat.userId"
                size="sm"
                class="bg-purple-500/20 text-purple-400"
              >
                Гость
              </UiBadge>
              <UiBadge
                :class="getStatusBadgeClass(CHAT_STATUS, chat.status)"
                size="sm"
              >
                {{ getStatusLabel(CHAT_STATUS, chat.status) }}
              </UiBadge>
              <span
                v-if="chat.unreadAdminCount > 0"
                class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full"
              >
                {{ chat.unreadAdminCount > 9 ? '9+' : chat.unreadAdminCount }}
              </span>
            </div>

            <p
              v-if="chat.subject"
              class="text-sm text-[var(--text-secondary)] truncate mb-1"
            >
              {{ chat.subject }}
            </p>

            <div class="flex items-center gap-3 text-xs text-[var(--text-muted)]">
              <span v-if="chat.assignedAdmin" class="flex items-center gap-1">
                <Icon name="heroicons:user" class="w-3 h-3" />
                {{ chat.assignedAdmin.fullName }}
              </span>
              <span v-if="chat.userTelegramId" class="flex items-center gap-1">
                <Icon name="simple-icons:telegram" class="w-3 h-3" />
                {{ chat.userTelegramId }}
              </span>
            </div>
          </div>

          <div class="text-right shrink-0">
            <span class="text-xs text-[var(--text-muted)]">
              <UiRelativeTime :date="chat.lastMessageAt" />
            </span>
            <Icon
              name="heroicons:chevron-right"
              class="w-5 h-5 text-[var(--text-muted)] mt-2"
            />
          </div>
        </div>
      </UiCard>

      <!-- Empty State -->
      <UiEmptyState
        v-if="filteredAndSortedChats.length === 0"
        :title="searchQuery.trim() ? 'Ничего не найдено по запросу' : (filters.status === 'all' ? 'Чатов пока нет' : 'Нет чатов с таким статусом')"
        icon="heroicons:chat-bubble-left-right"
      />
    </div>
  </div>
</template>
