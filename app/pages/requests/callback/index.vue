<script setup lang="ts">
import type { ColumnConfig, FilterConfig, RowActionConfig } from '~/types/admin-list'
import {
  CALLBACK_REQUEST_STATUS,
  CALLBACK_STATUS_OPTIONS,
} from '~/composables/useStatusConfig'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Обратный звонок — Админ-панель' })

const toast = useToast()

// Ref для доступа к AdminListPage
const listPageRef = ref<{ fetchItems: () => Promise<void> } | null>(null)

// Конфигурация колонок
const columns: ColumnConfig[] = [
  { key: 'name', label: 'Имя' },
  { key: 'phone', label: 'Телефон', format: 'phone' },
  { key: 'status', label: 'Статус', badge: { config: CALLBACK_REQUEST_STATUS } },
  { key: 'source', label: 'Источник' },
  { key: 'processedBy', label: 'Обработал' },
  { key: 'createdAt', label: 'Создана', sortable: true, format: 'relative' },
]

// Конфигурация фильтров
const filters: FilterConfig[] = [
  { key: 'status', type: 'buttons', options: CALLBACK_STATUS_OPTIONS, defaultValue: 'all' },
]

// Обновление статуса заявки
async function updateStatus(id: string, status: string) {
  try {
    await $fetch(`/api/admin/requests/callback/${id}`, {
      method: 'PATCH',
      body: { status },
    })
    toast.success('Статус обновлён')
    // Перезагрузка списка
    await listPageRef.value?.fetchItems()
  }
  catch {
    toast.error('Ошибка обновления статуса')
  }
}

// Hover-действия
const rowActions: RowActionConfig[] = [
  {
    key: 'call',
    icon: 'heroicons:phone',
    label: 'Позвонить',
    visible: row => !!row.phone,
    href: row => `tel:${row.phone}`,
  },
  {
    key: 'status',
    icon: 'heroicons:arrow-path',
    label: 'Сменить статус',
    dropdown: {
      options: CALLBACK_STATUS_OPTIONS.filter(o => o.value !== 'all'),
      onSelect: (row, value) => updateStatus(row.id as string, value),
    },
  },
]
</script>

<template>
  <AdminListPage
    ref="listPageRef"
    :columns="columns"
    :filters="filters"
    :row-actions="rowActions"
    title="Обратный звонок"
    icon="heroicons:phone-arrow-up-right"
    endpoint="/api/admin/requests/callback"
    response-key="requests"
    search-placeholder="Поиск по имени или телефону..."
    empty-icon="heroicons:phone-arrow-up-right"
    empty-text="Заявок не найдено"
  >
    <!-- Имя -->
    <template #name="{ row }">
      <span class="font-medium text-[var(--text-primary)]">{{ row.name }}</span>
    </template>

    <!-- Источник -->
    <template #source="{ row }">
      <span class="text-sm text-[var(--text-muted)]">{{ row.source || '—' }}</span>
    </template>

    <!-- Обработал -->
    <template #processedBy="{ row }">
      <span class="text-sm text-[var(--text-muted)]">
        {{ row.processedBy?.fullName || '—' }}
      </span>
    </template>
  </AdminListPage>
</template>
