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
    title="Заявки на подключение"
    icon="heroicons:signal"
    endpoint="/api/admin/requests"
    response-key="requests"
    search-placeholder="Поиск по имени или адресу..."
    empty-icon="heroicons:signal"
    empty-text="Заявок не найдено"
  >
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
