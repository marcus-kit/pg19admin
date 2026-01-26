<script setup lang="ts">
import type { NewsItem } from '~/types/admin'
import {
  NEWS_STATUS,
  NEWS_CATEGORY,
  NEWS_STATUS_OPTIONS,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'
import { useAdminList } from '~/composables/useAdminList'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Управление новостями — Админ-панель' })

const { formatDate } = useFormatters()

const {
  items: news,
  loading,
  filters,
  deleteItem,
} = useAdminList<NewsItem, { status: string }>({
  endpoint: '/api/admin/news',
  responseKey: 'news',
  initialFilters: { status: 'all' },
})

// Удаление новости с подтверждением
function deleteNews(id: string) {
  deleteItem(id, 'Удалить эту новость?')
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <h1 class="text-3xl font-bold text-[var(--text-primary)]">
        Управление новостями
      </h1>
      <UiButton @click="$router.push('/news/create')">
        <Icon name="heroicons:plus" class="w-5 h-5" />
        Создать новость
      </UiButton>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-6">
      <UiFilterTabs v-model="filters.status" :options="NEWS_STATUS_OPTIONS" />
    </div>

    <!-- Loading -->
    <UiLoading v-if="loading" />

    <!-- News List -->
    <div v-else class="space-y-4">
      <UiCard
        v-for="item in news"
        :key="item.id"
        class="hover:shadow-lg transition-shadow"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <UiBadge :class="getStatusBadgeClass(NEWS_STATUS, item.status)">
                {{ getStatusLabel(NEWS_STATUS, item.status) }}
              </UiBadge>
              <UiBadge :class="getStatusBadgeClass(NEWS_CATEGORY, item.category)">
                {{ getStatusLabel(NEWS_CATEGORY, item.category) }}
              </UiBadge>
              <Icon
                v-if="item.isPinned"
                name="heroicons:bookmark-solid"
                class="w-4 h-4 text-primary"
                title="Закреплено"
              />
            </div>

            <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {{ item.title }}
            </h3>

            <p v-if="item.summary" class="text-sm text-[var(--text-muted)] mb-3">
              {{ item.summary }}
            </p>

            <div class="text-xs text-[var(--text-muted)]">
              Создано: {{ formatDate(item.createdAt) }}
              <span v-if="item.publishedAt">
                • Опубликовано: {{ formatDate(item.publishedAt) }}
              </span>
            </div>
          </div>

          <div class="flex gap-2">
            <UiButton
              variant="ghost"
              size="sm"
              title="Редактировать"
              @click="$router.push(`/news/${item.id}/edit`)"
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
        </div>
      </UiCard>

      <!-- Empty State -->
      <UiEmptyState
        v-if="news.length === 0"
        :title="filters.status === 'all' ? 'Новостей пока нет' : `Нет новостей со статусом «${getStatusLabel(NEWS_STATUS, filters.status)}»`"
        icon="heroicons:newspaper"
      />
    </div>
  </div>
</template>
