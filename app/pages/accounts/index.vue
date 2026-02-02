<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════════════
// ИМПОРТЫ ТИПОВ
// ═══════════════════════════════════════════════════════════════════════════
import type { Account } from '~/types/admin'

// ═══════════════════════════════════════════════════════════════════════════
// ИМПОРТЫ
// ═══════════════════════════════════════════════════════════════════════════
import {
  ACCOUNT_STATUS,
  ACCOUNT_STATUS_OPTIONS,
  CONTRACT_STATUS,
  CONTRACT_STATUS_OPTIONS,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'
import { formatBalance } from '~/composables/useFormatters'

/** Фильтры для списка договоров */
interface AccountFilters extends Record<string, unknown> {
  contractStatus: string
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
useHead({ title: 'Договоры — Админ-панель' })

const {
  items: accounts,
  loading,
  filters,
  searchQuery,
  onSearchInput,
  fetchItems,
} = useAdminList<Account, AccountFilters>({
  endpoint: '/api/admin/accounts',
  responseKey: 'accounts',
  initialFilters: { contractStatus: 'all', status: 'all' },
})

// Навигация с клавиатуры
const listContainerRef = ref<HTMLElement | null>(null)
const focusedIndex = ref(-1)
const cardRefs = ref<(HTMLElement | null)[]>([])

// ═══════════════════════════════════════════════════════════════════════════
// COMPUTED
// ═══════════════════════════════════════════════════════════════════════════

/** Статистика для hero: всего и активных договоров */
const contractStats = computed(() => {
  const list = accounts.value
  const total = list.length
  const active = list.filter(a => a.contractStatus === 'active').length
  return { total, active }
})

// ═══════════════════════════════════════════════════════════════════════════
// МЕТОДЫ
// ═══════════════════════════════════════════════════════════════════════════

/** Переход на страницу договора (аккаунта) */
function goToAccount(account: Account) {
  navigateTo(`/accounts/${account.id}`)
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
  const list = accounts.value
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
        goToAccount(list[focusedIndex.value]!)
      }
      break
    default:
      break
  }
}

function onCardClick(account: Account, index: number) {
  focusedIndex.value = index
  goToAccount(account)
}

watch(accounts, (list) => {
  if (focusedIndex.value >= 0) {
    focusedIndex.value = Math.min(focusedIndex.value, Math.max(0, list.length - 1))
  }
})

// Кнопка «Стрелка вверх»
const pageRootRef = ref<HTMLElement | null>(null)
const { showScrollTop, scrollToTop } = useScrollToTop(pageRootRef)
</script>

<template>
  <div ref="pageRootRef" class="contracts-page">
    <!-- Hero: градиент + заголовок + статистика -->
    <header class="contracts-page__hero">
      <div class="contracts-page__hero-bg" aria-hidden="true" />
      <div class="contracts-page__hero-inner">
        <div class="flex items-center gap-3 mb-2">
          <div class="contracts-page__hero-icon">
            <Icon name="heroicons:document-text" class="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 class="contracts-page__hero-title">
              Договоры
            </h1>
            <p class="contracts-page__hero-subtitle">
              Лицевые счета и договоры
            </p>
          </div>
        </div>
        <div v-if="!loading" class="contracts-page__stats">
          <span class="contracts-page__stat">
            <strong>{{ contractStats.total }}</strong>
            {{ contractStats.total === 1 ? 'договор' : contractStats.total < 5 ? 'договора' : 'договоров' }}
          </span>
          <span v-if="contractStats.active > 0" class="contracts-page__stat contracts-page__stat--active">
            <span class="contracts-page__stat-dot" />
            <strong>{{ contractStats.active }}</strong> активных
          </span>
        </div>
      </div>
    </header>

    <!-- Панель фильтров и поиска -->
    <div class="contracts-page__toolbar">
      <nav class="contracts-page__nav" aria-label="Фильтр по статусу договора">
        <button
          v-for="opt in CONTRACT_STATUS_OPTIONS"
          :key="opt.value"
          type="button"
          class="contracts-page__nav-item"
          :class="{ 'contracts-page__nav-item--active': filters.contractStatus === opt.value }"
          @click="filters.contractStatus = opt.value"
        >
          {{ opt.label }}
        </button>
      </nav>
      <div class="contracts-page__bar-row">
        <div class="contracts-page__block contracts-page__block--search">
          <Icon name="heroicons:magnifying-glass" class="contracts-page__block-search-icon" aria-hidden="true" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Поиск по № договора или адресу..."
            class="contracts-page__block-search"
            aria-label="Поиск договоров"
            @input="onSearchInput"
          />
        </div>
        <div class="contracts-page__block contracts-page__block--status">
          <UiSelect
            v-model="filters.status"
            :options="ACCOUNT_STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))"
            placeholder="Статус счёта"
            size="md"
            class="contracts-page__block-status"
          />
        </div>
        <NuxtLink
          to="/accounts/create"
          class="contracts-page__block contracts-page__block--create"
        >
          <Icon name="heroicons:plus" class="w-4 h-4" />
          <span>Создать</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Loading -->
    <UiLoading v-if="loading" class="contracts-page__loading" />

    <!-- Account List -->
    <div
      v-else
      ref="listContainerRef"
      tabindex="0"
      role="list"
      aria-label="Список договоров"
      class="contracts-page__list outline-none"
      @keydown="onListKeydown"
    >
      <article
        v-for="(account, i) in accounts"
        :key="account.id"
        :ref="(el) => setCardRef(i, el)"
        class="contracts-page__card"
        :class="{ 'contracts-page__card--focused': i === focusedIndex }"
        tabindex="-1"
        @click="onCardClick(account, i)"
      >
        <div class="contracts-page__card-number">
          {{ account.contractNumber ?? '—' }}
        </div>
        <div class="contracts-page__card-body">
          <div class="contracts-page__card-top">
            <span class="contracts-page__card-name">
              <NuxtLink
                v-if="account.user"
                :to="`/users/${account.user.id}`"
                class="contracts-page__card-link"
                @click.stop
              >
                {{ account.user.fullName }}
              </NuxtLink>
              <span v-else class="text-[var(--text-muted)]">—</span>
            </span>
            <span class="contracts-page__card-balance">
              {{ formatBalance(account.balance) }}
            </span>
          </div>
          <p v-if="account.addressFull" class="contracts-page__card-address">
            {{ account.addressFull }}
          </p>
          <div class="contracts-page__card-meta">
            <UiBadge
              :class="getStatusBadgeClass(CONTRACT_STATUS, account.contractStatus)"
              size="sm"
            >
              {{ getStatusLabel(CONTRACT_STATUS, account.contractStatus) }}
            </UiBadge>
            <UiBadge
              :class="getStatusBadgeClass(ACCOUNT_STATUS, account.status)"
              size="sm"
            >
              {{ getStatusLabel(ACCOUNT_STATUS, account.status) }}
            </UiBadge>
            <span class="contracts-page__card-date">
              <UiRelativeTime :date="account.createdAt" />
            </span>
          </div>
        </div>
        <Icon name="heroicons:chevron-right" class="contracts-page__card-arrow" />
      </article>

      <!-- Empty state -->
      <div
        v-if="accounts.length === 0"
        class="contracts-page__empty"
      >
        <div class="contracts-page__empty-icon">
          <Icon name="heroicons:document-text" class="w-16 h-16 text-[var(--text-muted)]/40" />
        </div>
        <h2 class="contracts-page__empty-title">
          {{ searchQuery.trim() ? 'Ничего не найдено' : (filters.contractStatus === 'all' ? 'Договоров пока нет' : 'Нет договоров с этим статусом') }}
        </h2>
        <p class="contracts-page__empty-text">
          {{ searchQuery.trim() ? 'Попробуйте другой запрос или сбросьте фильтры' : 'Добавьте первый договор' }}
        </p>
      </div>
    </div>

    <Transition name="contracts-page-scroll-top">
      <button
        v-if="showScrollTop"
        type="button"
        class="contracts-page__scroll-top"
        aria-label="Прокрутить вверх"
        @click="scrollToTop"
      >
        <Icon name="heroicons:arrow-up" class="w-5 h-5" />
      </button>
    </Transition>
  </div>
</template>
