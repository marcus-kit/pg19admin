<script setup lang="ts">
import type { ConnectionRequest } from '~/types/admin'
import {
  CONNECTION_STATUS_OPTIONS,
  CONNECTION_REQUEST_STATUS,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Заявки на подключение — Админ-панель' })

const router = useRouter()
const route = useRoute()

interface ConnectionFilters {
  status: string
  inCoverage: boolean
}

const {
  items: requests,
  loading,
  filters,
  searchQuery,
  onSearchInput,
  fetchItems,
} = useAdminList<ConnectionRequest, ConnectionFilters>({
  endpoint: '/api/admin/requests',
  responseKey: 'requests',
  initialFilters: { status: 'all', inCoverage: false },
  transformParams: (f) => ({
    status: f.status === 'all' ? undefined : f.status,
    inCoverage: f.inCoverage ? 'true' : undefined,
  }),
})

const listContainerRef = ref<HTMLElement | null>(null)
const focusedIndex = ref(-1)
const cardRefs = ref<(HTMLElement | null)[]>([])

const stats = computed(() => {
  const list = requests.value
  const total = list.length
  const newCount = list.filter(r => r.status === 'new').length
  return { total, newCount }
})

function goToRequest(request: ConnectionRequest) {
  router.push(`/requests/${request.id}`)
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
  const list = requests.value
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
      if (focusedIndex.value >= 0) goToRequest(list[focusedIndex.value]!)
      break
    default:
      break
  }
}

function onCardClick(request: ConnectionRequest, index: number) {
  focusedIndex.value = index
  goToRequest(request)
}

watch(requests, (list) => {
  if (focusedIndex.value >= 0) {
    focusedIndex.value = Math.min(focusedIndex.value, Math.max(0, list.length - 1))
  }
})
</script>

<template>
  <div class="requests-page">
    <header class="requests-page__hero">
      <div class="requests-page__hero-bg" aria-hidden="true" />
      <div class="requests-page__hero-inner">
        <div class="flex items-center gap-3 mb-2">
          <div class="requests-page__hero-icon">
            <Icon name="heroicons:clipboard-document-list" class="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 class="requests-page__hero-title">Заявки</h1>
            <p class="requests-page__hero-subtitle">Заявки на подключение и обратный звонок</p>
          </div>
        </div>
        <div class="requests-page__nav-tabs">
          <NuxtLink
            to="/requests/connection"
            class="requests-page__nav-tab"
            :class="{ 'requests-page__nav-tab--active': route.path === '/requests/connection' }"
          >
            <Icon name="heroicons:signal" class="w-4 h-4" />
            Подключение
          </NuxtLink>
          <NuxtLink
            to="/requests/callback"
            class="requests-page__nav-tab"
            :class="{ 'requests-page__nav-tab--active': route.path === '/requests/callback' }"
          >
            <Icon name="heroicons:phone-arrow-up-right" class="w-4 h-4" />
            Обратный звонок
          </NuxtLink>
        </div>
        <div v-if="!loading" class="requests-page__stats">
          <span class="requests-page__stat"><strong>{{ stats.total }}</strong> заявок</span>
          <span v-if="stats.newCount > 0" class="requests-page__stat requests-page__stat--new">
            <span class="requests-page__stat-dot" />
            <strong>{{ stats.newCount }}</strong> новых
          </span>
        </div>
      </div>
    </header>

    <div class="requests-page__toolbar">
      <nav class="requests-page__nav" aria-label="Фильтр по статусу">
        <button
          v-for="opt in CONNECTION_STATUS_OPTIONS"
          :key="opt.value"
          type="button"
          class="requests-page__nav-item"
          :class="{ 'requests-page__nav-item--active': filters.status === opt.value }"
          @click="filters.status = opt.value"
        >
          {{ opt.label }}
        </button>
      </nav>
      <div class="requests-page__bar-row">
        <div class="requests-page__block requests-page__block--search">
          <Icon name="heroicons:magnifying-glass" class="requests-page__block-search-icon" aria-hidden="true" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Поиск по имени или адресу..."
            class="requests-page__block-search"
            aria-label="Поиск заявок"
            @input="onSearchInput"
          />
        </div>
        <label class="requests-page__toggle-wrap">
          <input v-model="filters.inCoverage" type="checkbox" class="requests-page__toggle-input">
          <span class="requests-page__toggle-label">В зоне покрытия</span>
        </label>
      </div>
    </div>

    <UiLoading v-if="loading" class="requests-page__loading" />

    <div
      v-else
      ref="listContainerRef"
      tabindex="0"
      role="list"
      aria-label="Список заявок на подключение"
      class="requests-page__list outline-none"
      @keydown="onListKeydown"
    >
      <article
        v-for="(req, i) in requests"
        :key="req.id"
        :ref="(el) => setCardRef(i, el)"
        class="requests-page__card"
        :class="{ 'requests-page__card--focused': i === focusedIndex }"
        tabindex="-1"
        @click="onCardClick(req, i)"
      >
        <div class="requests-page__card-body">
          <div class="requests-page__card-top">
            <span class="requests-page__card-name">{{ req.fullName }}</span>
            <UiBadge
              :class="getStatusBadgeClass(CONNECTION_REQUEST_STATUS, req.status)"
              size="sm"
            >
              {{ getStatusLabel(CONNECTION_REQUEST_STATUS, req.status) }}
            </UiBadge>
          </div>
          <p class="requests-page__card-phone">{{ req.phone }}</p>
          <p v-if="req.addressText" class="requests-page__card-address">
            {{ req.addressText }}
          </p>
          <div class="requests-page__card-meta">
            <span
              :class="req.inCoverageZone ? 'requests-page__meta--in-coverage' : 'requests-page__meta--out'"
              class="requests-page__meta-coverage"
            >
              {{ req.inCoverageZone ? 'В зоне' : 'Вне зоны' }}
            </span>
            <span v-if="req.source" class="requests-page__card-source">{{ req.source }}</span>
            <span class="requests-page__card-date">
              <UiRelativeTime :date="req.createdAt" />
            </span>
          </div>
        </div>
        <Icon name="heroicons:chevron-right" class="requests-page__card-arrow" />
      </article>

      <div
        v-if="requests.length === 0"
        class="requests-page__empty"
      >
        <Icon name="heroicons:signal" class="requests-page__empty-icon" />
        <h2 class="requests-page__empty-title">
          {{ searchQuery.trim() ? 'Ничего не найдено' : (filters.status === 'all' ? 'Заявок пока нет' : 'Нет заявок с этим статусом') }}
        </h2>
        <p class="requests-page__empty-text">
          {{ searchQuery.trim() ? 'Попробуйте другой запрос или сбросьте фильтры' : 'Заявки появятся здесь' }}
        </p>
      </div>
    </div>
  </div>
</template>
