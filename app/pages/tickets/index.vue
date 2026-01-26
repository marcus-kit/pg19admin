<script setup lang="ts">
import type { Ticket } from '~/types/admin'
import type { ColumnConfig, FilterConfig } from '~/types/admin-list'
import {
  TICKET_STATUS,
  TICKET_STATUS_OPTIONS,
  TICKET_PRIORITY,
  TICKET_PRIORITY_OPTIONS,
} from '~/composables/useStatusConfig'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Тикеты — Админ-панель' })

const router = useRouter()

// Конфигурация колонок
const columns: ColumnConfig[] = [
  { key: 'number', label: 'Номер', width: 'w-24' },
  { key: 'subject', label: 'Тема' },
  { key: 'status', label: 'Статус', badge: { config: TICKET_STATUS } },
  { key: 'priority', label: 'Приоритет', badge: { config: TICKET_PRIORITY } },
  { key: 'assignedAdmin', label: 'Назначен' },
  { key: 'createdAt', label: 'Создан', sortable: true, format: 'date' },
]

// Конфигурация фильтров
const filters: FilterConfig[] = [
  { key: 'status', type: 'buttons', options: TICKET_STATUS_OPTIONS, defaultValue: 'active' },
  { key: 'priority', type: 'select', options: TICKET_PRIORITY_OPTIONS, defaultValue: 'all', placeholder: 'Приоритет' },
  { key: 'assignedToMe', type: 'checkbox', label: 'Только мои', defaultValue: false },
]

// Трансформация параметров (виртуальный фильтр 'active')
function transformParams(f: Record<string, unknown>) {
  return {
    status: f.status === 'active' ? null : String(f.status),
    priority: f.priority === 'all' ? null : String(f.priority),
    assignedToMe: f.assignedToMe ? 'true' : null,
  }
}

// Переход к тикету
function goToTicket(ticket: Ticket) {
  router.push(`/tickets/${ticket.id}`)
}
</script>

<template>
  <AdminListPage
    :columns="columns"
    :filters="filters"
    :transform-params="transformParams"
    @row-click="goToTicket"
    title="Тикеты"
    icon="heroicons:ticket"
    endpoint="/api/admin/tickets"
    response-key="tickets"
    search-placeholder="Поиск по номеру или теме..."
    empty-icon="heroicons:ticket"
    empty-text="Тикетов не найдено"
  >
    <!-- Номер тикета -->
    <template #number="{ row }">
      <span class="font-mono text-sm text-primary">{{ row.number }}</span>
    </template>

    <!-- Тема + пользователь -->
    <template #subject="{ row }">
      <div class="max-w-md">
        <p class="truncate font-medium text-[var(--text-primary)]">{{ row.subject }}</p>
        <p class="text-xs text-[var(--text-muted)]">
          {{ row.userName || `Пользователь #${row.userId}` }}
          <span v-if="row.userEmail" class="ml-1">· {{ row.userEmail }}</span>
        </p>
      </div>
    </template>

    <!-- Назначенный админ -->
    <template #assignedAdmin="{ row }">
      <span class="text-sm text-[var(--text-secondary)]">
        {{ row.assignedAdmin?.fullName || '—' }}
      </span>
    </template>
  </AdminListPage>
</template>
