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
  senderType?: string
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
    status: 'all',
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
const senderType = ref<'all' | 'personal' | 'guest'>('all')
const filtersExpanded = ref(true)

// Опции для фильтра типа отправителя
const senderTypeOptions = [
  { value: 'all', label: 'Все' },
  { value: 'personal', label: 'Личный кабинет' },
  { value: 'guest', label: 'Гость' },
]

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
  
  // Формируем полное имя из ФИО
  const fullName = chat.userFirstName || chat.userLastName
    ? `${chat.userLastName || ''} ${chat.userFirstName || ''}`.trim()
    : null
  
  const fields = [
    chat.userName,
    chat.userFirstName,
    chat.userLastName,
    fullName,
    chat.guestName,
    chat.guestContact,
    chat.subject,
    chat.id,
    chat.userTelegramId != null ? String(chat.userTelegramId) : '',
    chat.assignedAdmin?.fullName,
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

  // Фильтрация по типу отправителя
  if (senderType.value !== 'all') {
    list = list.filter(chat => {
      if (senderType.value === 'personal') {
        return !!chat.userId // Личный кабинет - есть userId
      }
      if (senderType.value === 'guest') {
        return !chat.userId // Гость - нет userId
      }
      return true
    })
  }

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

/** Проверяет, есть ли активные фильтры */
const hasActiveFilters = computed(() => {
  return (
    filters.value.status !== 'all' ||
    senderType.value !== 'all' ||
    sortBy.value !== 'lastMessage' ||
    filters.value.assignedToMe !== false
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// МЕТОДЫ
// ═══════════════════════════════════════════════════════════════════════════

/** Генерация инициалов для чата */
function getChatInitials(chat: Chat): string {
  // Если есть имя и фамилия пользователя
  if (chat.userFirstName && chat.userLastName) {
    return `${chat.userFirstName.charAt(0)}${chat.userLastName.charAt(0)}`.toUpperCase()
  }
  if (chat.userFirstName) {
    return chat.userFirstName.charAt(0).toUpperCase()
  }
  
  // Если есть имя гостя, извлекаем инициалы
  if (chat.guestName) {
    const parts = chat.guestName.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0]?.charAt(0) || ''}${parts[parts.length - 1]?.charAt(0) || ''}`.toUpperCase()
    }
    return chat.guestName.charAt(0).toUpperCase()
  }
  
  // Если есть контакт гостя, используем первые буквы
  if (chat.guestContact) {
    const parts = chat.guestContact.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0]?.charAt(0) || ''}${parts[parts.length - 1]?.charAt(0) || ''}`.toUpperCase()
    }
    return chat.guestContact.charAt(0).toUpperCase()
  }
  
  // Если ничего нет, используем первые символы ID
  return chat.id.substring(0, 2).toUpperCase()
}

/** Получить отображаемое имя чата */
function getChatDisplayName(chat: Chat): string {
  // Приоритет: ФИО из личного кабинета
  if (chat.userFirstName || chat.userLastName) {
    return `${chat.userLastName || ''} ${chat.userFirstName || ''}`.trim()
  }
  if (chat.userName) return chat.userName
  if (chat.guestName) return chat.guestName
  return `Чат #${chat.id}`
}

/** Проверка, является ли чат из личного кабинета */
function isPersonalCabinetChat(chat: Chat): boolean {
  return !!chat.userId
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

/** Сбросить все фильтры к значениям по умолчанию */
function resetFilters() {
  filters.value.status = 'all'
  senderType.value = 'all'
  sortBy.value = 'lastMessage'
  filters.value.assignedToMe = false
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
  <div class="flex gap-6">
    <!-- Левая колонка: Заголовок, поиск и список чатов -->
    <div class="flex-1 min-w-0">
    <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-4 mb-4">
          <h1 class="flex items-center gap-3 text-3xl font-bold text-[var(--text-primary)] whitespace-nowrap flex-shrink-0">
            <Icon name="heroicons:chat-bubble-left-right" class="h-8 w-8" />
        Чаты поддержки
      </h1>
          
          <UiInput
            v-model="searchQuery"
            type="search"
            placeholder="Поиск..."
            class="flex-1 min-w-0"
          >
            <template #prefix>
              <Icon name="heroicons:magnifying-glass" class="w-4 h-4" />
            </template>
          </UiInput>
        </div>
      </div>

    <!-- Chat List (с навигацией с клавиатуры) -->
    <div
      ref="listContainerRef"
      tabindex="0"
      role="list"
      aria-label="Список чатов"
        :class="[
          'outline-none focus:outline-none space-y-3 transition-opacity duration-200',
          loading && 'opacity-50 pointer-events-none'
        ]"
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
              <!-- Аватар с инициалами, если нет имени и ФИО -->
              <div
                v-if="!chat.userName && !chat.guestName && !chat.userFirstName && !chat.userLastName"
                class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex-shrink-0"
              >
                <span class="text-xs font-medium text-[var(--text-primary)]">
                  {{ getChatInitials(chat) }}
                </span>
              </div>
              <span class="font-medium text-[var(--text-primary)]">
                {{ getChatDisplayName(chat) }}
              </span>
              <span
                v-if="chat.guestContact"
                class="text-xs text-[var(--text-muted)]"
              >
                ({{ chat.guestContact }})
              </span>
              <UiBadge
                v-if="isPersonalCabinetChat(chat)"
                size="sm"
                class="bg-blue-500/20 text-blue-400"
              >
                Личный кабинет
              </UiBadge>
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
          v-if="!loading && filteredAndSortedChats.length === 0"
        :title="searchQuery.trim() ? 'Ничего не найдено по запросу' : (filters.status === 'all' ? 'Чатов пока нет' : 'Нет чатов с таким статусом')"
        icon="heroicons:chat-bubble-left-right"
      />
        
        <!-- Индикатор загрузки -->
        <div
          v-if="loading && filteredAndSortedChats.length === 0"
          class="flex items-center justify-center py-12"
        >
          <UiLoading />
        </div>
      </div>
    </div>

    <!-- Правая колонка: Панель фильтров -->
    <aside class="hidden lg:block w-80 flex-shrink-0">
      <div class="glass-card rounded-xl border border-[var(--glass-border)] backdrop-blur-sm overflow-hidden">
        <!-- Заголовок панели с кнопкой сворачивания -->
        <button
          @click="filtersExpanded = !filtersExpanded"
          class="w-full flex items-center justify-between p-4 hover:bg-[var(--glass-bg)] transition-colors"
        >
          <div class="flex items-center gap-2">
            <Icon name="heroicons:funnel" class="w-5 h-5 text-[var(--text-primary)]" />
            <span class="font-semibold text-[var(--text-primary)]">Фильтры</span>
            
            <!-- Кнопка сброса фильтров -->
            <UiButton
              v-if="hasActiveFilters"
              @click.stop="resetFilters"
              variant="ghost"
              size="sm"
              class="flex-shrink-0 ml-2"
            >
              <Icon name="heroicons:arrow-path" class="w-4 h-4" />
              Сбросить
            </UiButton>
          </div>
          
          <Icon
            :name="filtersExpanded ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
            class="w-5 h-5 text-[var(--text-muted)] transition-transform"
          />
        </button>

        <!-- Содержимое панели -->
        <Transition name="slide">
          <div v-if="filtersExpanded" class="px-4 pb-4 space-y-4">
            <!-- Статус чата -->
            <div>
              <label class="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wide">
                Статус
              </label>
              <UiFilterTabs v-model="filters.status" :options="CHAT_STATUS_OPTIONS" />
            </div>

            <!-- Тип отправителя -->
            <div>
              <label class="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wide">
                Тип отправителя
              </label>
              <UiFilterTabs v-model="senderType as any" :options="senderTypeOptions" />
            </div>

            <!-- Сортировка -->
            <div>
              <label class="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wide">
                Сортировка
              </label>
              <UiFilterTabs v-model="sortBy as any" :options="SORT_OPTIONS.map(o => ({ value: o.value, label: o.label }))" />
            </div>

            <!-- Только мои -->
            <div>
              <label
                for="showMine"
                class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[var(--glass-bg)] transition-colors"
              >
                <input
                  id="showMine"
                  v-model="filters.assignedToMe"
                  type="checkbox"
                  class="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary cursor-pointer"
                />
                <span class="text-sm font-medium text-[var(--text-primary)]">Только мои</span>
              </label>
            </div>
          </div>
        </Transition>
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* Анимация сворачивания/разворачивания панели фильтров */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>
