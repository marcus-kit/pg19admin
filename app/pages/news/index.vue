<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════════════
// ИМПОРТЫ ТИПОВ
// ═══════════════════════════════════════════════════════════════════════════
import type { NewsItem } from '~/types/admin'

// ═══════════════════════════════════════════════════════════════════════════
// ИМПОРТЫ
// ═══════════════════════════════════════════════════════════════════════════
import {
  NEWS_STATUS,
  NEWS_CATEGORY,
  NEWS_STATUS_OPTIONS,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'
import { formatDate } from '~/composables/useFormatters'

/** Фильтры для списка новостей */
interface NewsFilters extends Record<string, unknown> {
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
useHead({ title: 'Управление новостями — Админ-панель' })

const {
  items: news,
  loading,
  filters,
  deleteItem,
} = useAdminList<NewsItem, NewsFilters>({
  endpoint: '/api/admin/news',
  responseKey: 'news',
  initialFilters: { status: 'all' },
})

// Клиентский поиск по заголовку и краткому описанию
const searchQuery = ref('')

// Навигация с клавиатуры
const listContainerRef = ref<HTMLElement | null>(null)
const focusedIndex = ref(-1)
const cardRefs = ref<(HTMLElement | null)[]>([])

// ═══════════════════════════════════════════════════════════════════════════
// COMPUTED
// ═══════════════════════════════════════════════════════════════════════════

function normalizeSearch(s: string): string {
  return s.trim().toLowerCase()
}

function newsMatchesSearch(item: NewsItem, query: string): boolean {
  if (!query) return true
  const q = normalizeSearch(query)
  const fields = [item.title, item.summary].filter(Boolean) as string[]
  return fields.some(f => f.toLowerCase().includes(q))
}

/** Список новостей после поиска (только фронтенд) */
const filteredNews = computed(() => {
  const query = normalizeSearch(searchQuery.value)
  return query ? news.value.filter(n => newsMatchesSearch(n, searchQuery.value)) : [...news.value]
})

/** Статистика для hero: всего и опубликованных */
const newsStats = computed(() => {
  const list = news.value
  const total = list.length
  const published = list.filter(n => n.status === 'published').length
  return { total, published }
})

// ═══════════════════════════════════════════════════════════════════════════
// МЕТОДЫ
// ═══════════════════════════════════════════════════════════════════════════

function goToEdit(item: NewsItem) {
  navigateTo(`/news/${item.id}/edit`)
}

function deleteNews(id: string) {
  deleteItem(id, 'Удалить эту новость?')
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
  const list = filteredNews.value
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
        goToEdit(list[focusedIndex.value]!)
      }
      break
    default:
      break
  }
}

function onCardClick(item: NewsItem, index: number) {
  focusedIndex.value = index
  goToEdit(item)
}

watch(filteredNews, (list) => {
  if (focusedIndex.value >= 0) {
    focusedIndex.value = Math.min(focusedIndex.value, Math.max(0, list.length - 1))
  }
})
</script>

<template>
  <div class="news-page">
    <!-- Hero: градиент + заголовок + статистика -->
    <header class="news-page__hero">
      <div class="news-page__hero-bg" aria-hidden="true" />
      <div class="news-page__hero-inner">
        <div class="flex items-center gap-3 mb-2">
          <div class="news-page__hero-icon">
            <Icon name="heroicons:newspaper" class="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 class="news-page__hero-title">
              Управление новостями
            </h1>
            <p class="news-page__hero-subtitle">
              Публикации и объявления
            </p>
          </div>
        </div>
        <div v-if="!loading" class="news-page__stats">
          <span class="news-page__stat">
            <strong>{{ newsStats.total }}</strong>
            {{ newsStats.total === 1 ? 'новость' : newsStats.total < 5 ? 'новости' : 'новостей' }}
          </span>
          <span v-if="newsStats.published > 0" class="news-page__stat news-page__stat--published">
            <span class="news-page__stat-dot" />
            <strong>{{ newsStats.published }}</strong> опубликовано
          </span>
        </div>
      </div>
    </header>

    <!-- Панель фильтров и поиска -->
    <div class="news-page__toolbar">
      <nav class="news-page__nav" aria-label="Фильтр по статусу">
        <button
          v-for="opt in NEWS_STATUS_OPTIONS"
          :key="opt.value"
          type="button"
          class="news-page__nav-item"
          :class="{ 'news-page__nav-item--active': filters.status === opt.value }"
          @click="filters.status = opt.value"
        >
          {{ opt.label }}
        </button>
      </nav>
      <div class="news-page__bar-row">
        <div class="news-page__block news-page__block--search">
          <Icon name="heroicons:magnifying-glass" class="news-page__block-search-icon" aria-hidden="true" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Поиск по заголовку или описанию..."
            class="news-page__block-search"
            aria-label="Поиск новостей"
          />
        </div>
        <NuxtLink
          to="/news/create"
          class="news-page__block news-page__block--create"
        >
          <Icon name="heroicons:plus" class="w-4 h-4" />
          <span>Создать</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Loading -->
    <UiLoading v-if="loading" class="news-page__loading" />

    <!-- News List -->
    <div
      v-else
      ref="listContainerRef"
      tabindex="0"
      role="list"
      aria-label="Список новостей"
      class="news-page__list outline-none"
      @keydown="onListKeydown"
    >
      <article
        v-for="(item, i) in filteredNews"
        :key="item.id"
        :ref="(el) => setCardRef(i, el)"
        class="news-page__card"
        :class="{ 'news-page__card--focused': i === focusedIndex }"
        tabindex="-1"
        @click="onCardClick(item, i)"
      >
        <div class="news-page__card-body">
          <div class="news-page__card-top">
            <span class="news-page__card-title">{{ item.title }}</span>
            <span class="news-page__card-date">
              {{ formatDate(item.createdAt) }}
            </span>
          </div>
          <p v-if="item.summary" class="news-page__card-summary">
            {{ item.summary }}
          </p>
          <div class="news-page__card-meta">
            <UiBadge
              :class="getStatusBadgeClass(NEWS_STATUS, item.status)"
              size="sm"
            >
              {{ getStatusLabel(NEWS_STATUS, item.status) }}
            </UiBadge>
            <UiBadge
              :class="getStatusBadgeClass(NEWS_CATEGORY, item.category)"
              size="sm"
            >
              {{ getStatusLabel(NEWS_CATEGORY, item.category) }}
            </UiBadge>
            <Icon
              v-if="item.isPinned"
              name="heroicons:bookmark-solid"
              class="news-page__card-pinned"
              title="Закреплено"
            />
            <span v-if="item.publishedAt" class="news-page__card-pub">
              Опубликовано: {{ formatDate(item.publishedAt) }}
            </span>
          </div>
        </div>
        <div class="news-page__card-actions" @click.stop>
          <UiButton
            variant="ghost"
            size="sm"
            title="Редактировать"
            @click="goToEdit(item)"
          >
            <Icon name="heroicons:pencil" class="w-4 h-4" />
          </UiButton>
          <UiButton
            variant="ghost"
            size="sm"
            title="Удалить"
            @click="deleteNews(item.id)"
          >
            <Icon name="heroicons:trash" class="w-4 h-4 text-red-400" />
          </UiButton>
        </div>
        <Icon name="heroicons:chevron-right" class="news-page__card-arrow" />
      </article>

      <!-- Empty state -->
      <div
        v-if="filteredNews.length === 0"
        class="news-page__empty"
      >
        <div class="news-page__empty-icon">
          <Icon name="heroicons:newspaper" class="w-16 h-16 text-[var(--text-muted)]/40" />
        </div>
        <h2 class="news-page__empty-title">
          {{ searchQuery.trim() ? 'Ничего не найдено' : (filters.status === 'all' ? 'Новостей пока нет' : `Нет новостей со статусом «${getStatusLabel(NEWS_STATUS, filters.status)}»`) }}
        </h2>
        <p class="news-page__empty-text">
          {{ searchQuery.trim() ? 'Попробуйте другой запрос или сбросьте фильтры' : 'Создайте первую новость' }}
        </p>
      </div>
    </div>
  </div>
</template>
