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

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Тикеты — Админ-панель' })

const { formatDateTime } = useFormatters()

interface TicketFilters {
  status: string
  priority: string
  assignedToMe: boolean
}

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

const goToTicket = (id: string) => {
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
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-[var(--glass-border)]">
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Номер</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Тема</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Статус</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Приоритет</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Назначен</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Создан</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="ticket in tickets"
            :key="ticket.id"
            class="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] cursor-pointer transition-colors"
            @click="goToTicket(ticket.id)"
          >
            <td class="py-3 px-4">
              <span class="font-mono text-sm text-primary">{{ ticket.number }}</span>
            </td>
            <td class="py-3 px-4">
              <div class="max-w-md">
                <p class="font-medium text-[var(--text-primary)] truncate">{{ ticket.subject }}</p>
                <p class="text-xs text-[var(--text-muted)]">
                  {{ ticket.userName || `Пользователь #${ticket.userId}` }}
                  <span v-if="ticket.userEmail" class="ml-1">· {{ ticket.userEmail }}</span>
                </p>
              </div>
            </td>
            <td class="py-3 px-4">
              <UiBadge :class="getStatusBadgeClass(TICKET_STATUS, ticket.status)" size="sm">
                {{ getStatusLabel(TICKET_STATUS, ticket.status) }}
              </UiBadge>
            </td>
            <td class="py-3 px-4">
              <UiBadge :class="getStatusBadgeClass(TICKET_PRIORITY, ticket.priority)" size="sm">
                {{ getStatusLabel(TICKET_PRIORITY, ticket.priority) }}
              </UiBadge>
            </td>
            <td class="py-3 px-4 text-sm text-[var(--text-secondary)]">
              {{ ticket.assignedAdmin?.fullName || '—' }}
            </td>
            <td class="py-3 px-4 text-sm text-[var(--text-muted)]">
              {{ formatDateTime(ticket.createdAt) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <UiEmptyState
        v-if="tickets.length === 0"
        icon="heroicons:ticket"
        title="Тикетов не найдено"
      />
    </div>
  </div>
</template>
