<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════════════
// ИМПОРТЫ ТИПОВ
// ═══════════════════════════════════════════════════════════════════════════
import type { User } from '~/types/admin'

// ═══════════════════════════════════════════════════════════════════════════
// ИМПОРТЫ
// ═══════════════════════════════════════════════════════════════════════════
import {
  USER_STATUS,
  USER_STATUS_OPTIONS,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'

/** Фильтры для списка пользователей */
interface UserFilters extends Record<string, unknown> {
  status: string
}

// ═══════════════════════════════════════════════════════════════════════════
// МАКРОСЫ
// ═══════════════════════════════════════════════════════════════════════════
definePageMeta({
  middleware: 'admin',
})

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLES
// ═══════════════════════════════════════════════════════════════════════════
useHead({ title: 'Пользователи — Админ-панель' })

const router = useRouter()

const {
  items: users,
  loading,
  filters,
  searchQuery,
  onSearchInput,
  fetchItems,
} = useAdminList<User, UserFilters>({
  endpoint: '/api/admin/users',
  responseKey: 'users',
  initialFilters: { status: 'all' },
})

// Навигация с клавиатуры
const listContainerRef = ref<HTMLElement | null>(null)
const focusedIndex = ref(-1)
const cardRefs = ref<(HTMLElement | null)[]>([])

// ═══════════════════════════════════════════════════════════════════════════
// COMPUTED
// ═══════════════════════════════════════════════════════════════════════════

/** Статистика для hero: всего и по статусам */
const userStats = computed(() => {
  const list = users.value
  const total = list.length
  const active = list.filter(u => u.status === 'active').length
  return { total, active }
})

// ═══════════════════════════════════════════════════════════════════════════
// МЕТОДЫ
// ═══════════════════════════════════════════════════════════════════════════

/** Инициалы для аватарки пользователя */
function getUserInitials(user: User): string {
  const first = user.firstName?.charAt(0) || ''
  const last = user.lastName?.charAt(0) || ''
  return (first + last).toUpperCase() || '?'
}

/** Переход на страницу пользователя */
function goToUser(user: User) {
  router.push(`/users/${user.id}`)
}

function setCardRef(i: number, el: unknown) {
  if (el) {
    const arr = cardRefs.value
    while (arr.length <= i) arr.push(null)
    const node = el && typeof el === 'object' && '$el' in el ? (el as { $el: HTMLElement }).$el : el
    arr[i] = node as HTMLElement
  }
}

function onListKeydown(e: KeyboardEvent) {
  const list = users.value
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
        goToUser(list[focusedIndex.value]!)
      }
      break
    default:
      break
  }
}

function onCardClick(user: User, index: number) {
  focusedIndex.value = index
  goToUser(user)
}

watch(users, (list) => {
  if (focusedIndex.value >= 0) {
    focusedIndex.value = Math.min(focusedIndex.value, Math.max(0, list.length - 1))
  }
})

// Кнопка «Стрелка вверх»
const pageRootRef = ref<HTMLElement | null>(null)
const { showScrollTop, scrollToTop } = useScrollToTop(pageRootRef)
</script>

<template>
  <div ref="pageRootRef" class="user-page">
    <!-- Hero: градиент + заголовок + статистика -->
    <header class="user-page__hero">
      <div class="user-page__hero-bg" aria-hidden="true" />
      <div class="user-page__hero-inner">
        <div class="flex items-center gap-3 mb-2">
          <div class="user-page__hero-icon">
            <Icon name="heroicons:users" class="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 class="user-page__hero-title">
              Пользователи
            </h1>
            <p class="user-page__hero-subtitle">
              Управление пользователями системы
            </p>
          </div>
        </div>
        <div v-if="!loading" class="user-page__stats">
          <span class="user-page__stat">
            <strong>{{ userStats.total }}</strong>
            {{ userStats.total === 1 ? 'пользователь' : userStats.total < 5 ? 'пользователя' : 'пользователей' }}
          </span>
          <span v-if="userStats.active > 0" class="user-page__stat user-page__stat--active">
            <span class="user-page__stat-dot" />
            <strong>{{ userStats.active }}</strong> активных
          </span>
        </div>
      </div>
    </header>

    <!-- Панель фильтров и поиска -->
    <div class="user-page__toolbar">
      <nav class="user-page__nav" aria-label="Фильтр по статусу">
        <button
          v-for="opt in USER_STATUS_OPTIONS"
          :key="opt.value"
          type="button"
          class="user-page__nav-item"
          :class="{ 'user-page__nav-item--active': filters.status === opt.value }"
          @click="filters.status = opt.value"
        >
          {{ opt.label }}
        </button>
      </nav>
      <div class="user-page__bar-row">
        <div class="user-page__block user-page__block--search">
          <Icon name="heroicons:magnifying-glass" class="user-page__block-search-icon" aria-hidden="true" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Поиск по имени, телефону, email..."
            class="user-page__block-search"
            aria-label="Поиск пользователей"
            @input="onSearchInput"
          />
        </div>
        <NuxtLink
          to="/users/create"
          class="user-page__block user-page__block--create"
        >
          <Icon name="heroicons:plus" class="w-4 h-4" />
          <span>Создать</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Loading -->
    <UiLoading v-if="loading" class="user-page__loading" />

    <!-- User List -->
    <div
      v-else
      ref="listContainerRef"
      tabindex="0"
      role="list"
      aria-label="Список пользователей"
      class="user-page__list outline-none"
      @keydown="onListKeydown"
    >
      <article
        v-for="(user, i) in users"
        :key="user.id"
        :ref="(el) => setCardRef(i, el)"
        class="user-page__card"
        :class="{ 'user-page__card--focused': i === focusedIndex }"
        tabindex="-1"
        @click="onCardClick(user, i)"
      >
        <div class="user-page__card-avatar">
          <span>{{ getUserInitials(user) }}</span>
        </div>
        <div class="user-page__card-body">
          <div class="user-page__card-top">
            <span class="user-page__card-name">
              {{ user.fullName || '—' }}
            </span>
            <span class="user-page__card-time">
              <UiRelativeTime :date="user.lastSeenAt" />
            </span>
          </div>
          <p v-if="user.phone || user.email" class="user-page__card-contacts">
            {{ user.phone || user.email }}
          </p>
          <div class="user-page__card-meta">
            <UiBadge
              :class="getStatusBadgeClass(USER_STATUS, user.status)"
              size="sm"
            >
              {{ getStatusLabel(USER_STATUS, user.status) }}
            </UiBadge>
            <span class="user-page__card-accounts">
              {{ user.accountsCount }} {{ user.accountsCount === 1 ? 'аккаунт' : user.accountsCount < 5 ? 'аккаунта' : 'аккаунтов' }}
            </span>
          </div>
        </div>
        <Icon name="heroicons:chevron-right" class="user-page__card-arrow" />
      </article>

      <!-- Empty state -->
      <div
        v-if="users.length === 0"
        class="user-page__empty"
      >
        <div class="user-page__empty-icon">
          <Icon name="heroicons:users" class="w-16 h-16 text-[var(--text-muted)]/40" />
        </div>
        <h2 class="user-page__empty-title">
          {{ searchQuery.trim() ? 'Ничего не найдено' : (filters.status === 'all' ? 'Пользователей пока нет' : 'Нет пользователей с этим статусом') }}
        </h2>
        <p class="user-page__empty-text">
          {{ searchQuery.trim() ? 'Попробуйте другой запрос или сбросьте фильтры' : 'Добавьте первого пользователя' }}
        </p>
      </div>
    </div>

    <!-- Кнопка «Стрелка вверх» -->
    <Transition name="user-page-scroll-top">
      <button
        v-if="showScrollTop"
        type="button"
        class="user-page__scroll-top"
        aria-label="Прокрутить вверх"
        @click="scrollToTop"
      >
        <Icon name="heroicons:arrow-up" class="w-5 h-5" />
      </button>
    </Transition>
  </div>
</template>
