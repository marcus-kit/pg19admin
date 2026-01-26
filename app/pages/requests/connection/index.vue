<script setup lang="ts">
import type { ColumnConfig, FilterConfig } from '~/types/admin-list'
import {
  CONNECTION_REQUEST_STATUS,
  CONNECTION_STATUS_OPTIONS,
} from '~/composables/useStatusConfig'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Заявки на подключение — Админ-панель' })

const router = useRouter()

// Конфигурация колонок
const columns: ColumnConfig[] = [
  { key: 'user', label: 'Заявитель' },
  { key: 'addressText', label: 'Адрес' },
  { key: 'status', label: 'Статус', badge: { config: CONNECTION_REQUEST_STATUS } },
  { key: 'inCoverageZone', label: 'Зона покрытия' },
  { key: 'source', label: 'Источник' },
  { key: 'createdAt', label: 'Создана', sortable: true, format: 'relative' },
]

// Конфигурация фильтров
const filters: FilterConfig[] = [
  { key: 'status', type: 'buttons', options: CONNECTION_STATUS_OPTIONS, defaultValue: 'all' },
  { key: 'inCoverage', type: 'checkbox', label: 'В зоне покрытия', defaultValue: false },
]

// Переход к заявке
function goToRequest(request: Record<string, unknown>) {
  router.push(`/requests/${request.id}`)
}
</script>

<template>
  <AdminListPage
    :columns="columns"
    :filters="filters"
    @row-click="goToRequest"
    title="Заявки"
    icon="heroicons:clipboard-document-list"
    endpoint="/api/admin/requests"
    response-key="requests"
    search-placeholder="Поиск по имени или адресу..."
    empty-icon="heroicons:signal"
    empty-text="Заявок не найдено"
  >
    <!-- Табы переключения типа заявок -->
    <template #header-actions>
      <div class="flex gap-1 p-1 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
        <NuxtLink
          to="/requests/connection"
          class="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors min-w-[160px] bg-primary text-white"
        >
          <Icon name="heroicons:signal" class="h-4 w-4" />
          Подключение
        </NuxtLink>
        <NuxtLink
          to="/requests/callback"
          class="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors min-w-[180px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover-bg)]"
        >
          <Icon name="heroicons:phone-arrow-up-right" class="h-4 w-4" />
          Обратный звонок
        </NuxtLink>
      </div>
    </template>
    <!-- Заявитель -->
    <template #user="{ row }">
      <div>
        <p class="font-medium text-[var(--text-primary)]">{{ row.fullName }}</p>
        <p class="text-xs text-[var(--text-muted)]">{{ row.phone }}</p>
      </div>
    </template>

    <!-- Адрес -->
    <template #addressText="{ row }">
      <span class="block max-w-xs truncate text-sm text-[var(--text-muted)]">
        {{ row.addressText || '—' }}
      </span>
    </template>

    <!-- Зона покрытия -->
    <template #inCoverageZone="{ row }">
      <span :class="row.inCoverageZone ? 'text-green-400' : 'text-[var(--text-muted)]'" class="text-sm">
        {{ row.inCoverageZone ? 'Да' : 'Нет' }}
      </span>
    </template>

    <!-- Источник -->
    <template #source="{ row }">
      <span class="text-sm text-[var(--text-muted)]">{{ row.source || '—' }}</span>
    </template>
  </AdminListPage>
</template>
