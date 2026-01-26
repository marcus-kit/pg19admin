<script setup lang="ts">
import type { Ticket } from '~/types/admin'
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  TICKET_STATUS_OPTIONS,
  TICKET_PRIORITY_OPTIONS,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'
import { useAdminList } from '~/composables/useAdminList'

// Фильтры для списка тикетов
interface TicketFilters {
  status: string
  priority: string
  assignedToMe: boolean
}

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Тикеты — Админ-панель' })

const { formatDateTime } = useFormatters()

const {
  items: tickets,
  loading,
  total,
  filters,
} = useAdminList<Ticket, TicketFilters>({
  endpoint: '/api/admin/tickets',
  responseKey: 'tickets',
  initialFilters: {
    status: 'active',
    priority: 'all',
    assignedToMe: false,
  },
  // Transform virtual 'active' filter to API format
  transformParams: f => ({
    // 'active' is default — API shows new, open, pending when no status param
    status: f.status === 'active' ? null : f.status,
    priority: f.priority,
    assignedToMe: f.assignedToMe ? 'true' : null,
  }),
})

// Колонки таблицы тикетов
const columns = [
  { key: 'number', label: 'Номер' },
  { key: 'subject', label: 'Тема' },
  { key: 'status', label: 'Статус' },
  { key: 'priority', label: 'Приоритет' },
  { key: 'assignedAdmin', label: 'Назначен' },
  { key: 'createdAt', label: 'Создан', sortable: true },
]

// Переход на страницу тикета
function goToTicket(id: string) {
  navigateTo(`/tickets/${id}`)
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <h1 class="text-3xl font-bold text-[var(--text-primary)]">
        Тикеты
        <span v-if="total > 0" class="text-lg font-normal text-[var(--text-muted)]">
          ({{ total }})
        </span>
      </h1>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <!-- Status Filter -->
      <UiFilterTabs v-model="filters.status" :options="TICKET_STATUS_OPTIONS" />

      <div class="flex items-center gap-4 ml-auto">
        <!-- Priority Filter -->
        <UiSelect
          v-model="filters.priority"
          :options="TICKET_PRIORITY_OPTIONS"
          :placeholder="undefined"
          size="sm"
        />

        <!-- My Tickets -->
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="filters.assignedToMe"
            type="checkbox"
            class="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary"
          />
          <span class="text-sm text-[var(--text-secondary)]">Только мои</span>
        </label>
      </div>
    </div>

    <!-- Loading -->
    <UiLoading v-if="loading" />

    <!-- Tickets Table -->
    <UiTable
      v-else
      :data="tickets"
      :columns="columns"
      @row-click="(row) => goToTicket(row.id)"
      empty-icon="heroicons:ticket"
      empty-text="Тикетов не найдено"
    >
      <template #number="{ row }">
        <span class="font-mono text-sm text-primary">{{ row.number }}</span>
      </template>

      <template #subject="{ row }">
        <div class="max-w-md">
          <p class="font-medium text-[var(--text-primary)] truncate">{{ row.subject }}</p>
          <p class="text-xs text-[var(--text-muted)]">
            {{ row.userName || `Пользователь #${row.userId}` }}
            <span v-if="row.userEmail" class="ml-1">· {{ row.userEmail }}</span>
          </p>
        </div>
      </template>

      <template #status="{ row }">
        <UiBadge :class="getStatusBadgeClass(TICKET_STATUS, row.status)" size="sm">
          {{ getStatusLabel(TICKET_STATUS, row.status) }}
        </UiBadge>
      </template>

      <template #priority="{ row }">
        <UiBadge :class="getStatusBadgeClass(TICKET_PRIORITY, row.priority)" size="sm">
          {{ getStatusLabel(TICKET_PRIORITY, row.priority) }}
        </UiBadge>
      </template>

      <template #assignedAdmin="{ row }">
        <span class="text-sm text-[var(--text-secondary)]">
          {{ row.assignedAdmin?.fullName || '—' }}
        </span>
      </template>

      <template #createdAt="{ row }">
        <span class="text-sm text-[var(--text-muted)]">{{ formatDateTime(row.createdAt) }}</span>
      </template>
    </UiTable>
  </div>
</template>
