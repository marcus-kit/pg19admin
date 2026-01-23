<script setup lang="ts">
import type { Ticket } from '~/types/admin'
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  TICKET_CATEGORY,
  TICKET_STATUS_OPTIONS,
  TICKET_PRIORITY_OPTIONS,
  getStatusLabel,
  getStatusBadgeClass
} from '~/composables/useStatusConfig'

definePageMeta({
  middleware: 'admin'
})

useHead({ title: 'Тикеты — Админ-панель' })

const toast = useToast()
const { formatDateTime } = useFormatters()

const goToTicket = (id: string) => {
  navigateTo(`/tickets/${id}`)
}

const loading = ref(true)
const tickets = ref<Ticket[]>([])
const total = ref(0)
const statusFilter = ref<string>('active')
const priorityFilter = ref<string>('all')
const showMine = ref(false)

// Custom fetch logic due to special 'active' status handling
const fetchTickets = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()

    // 'active' is the default - don't send status param (API shows new, open, pending)
    if (statusFilter.value !== 'active') {
      params.set('status', statusFilter.value)
    }

    if (priorityFilter.value !== 'all') {
      params.set('priority', priorityFilter.value)
    }

    if (showMine.value) {
      params.set('assignedToMe', 'true')
    }

    const data = await $fetch<{ tickets: Ticket[]; total: number }>(`/api/admin/tickets?${params}`)
    tickets.value = data.tickets
    total.value = data.total
  } catch (error) {
    console.error('Failed to fetch tickets:', error)
    toast.error('Не удалось загрузить тикеты')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTickets()
})

watch([statusFilter, priorityFilter, showMine], () => {
  fetchTickets()
})
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
      <div class="flex gap-1 flex-wrap">
        <UiButton
          v-for="opt in TICKET_STATUS_OPTIONS"
          :key="opt.value"
          variant="ghost"
          size="sm"
          :class="{ 'bg-primary/20': statusFilter === opt.value }"
          @click="statusFilter = opt.value"
        >
          {{ opt.label }}
        </UiButton>
      </div>

      <div class="flex items-center gap-4 ml-auto">
        <!-- Priority Filter -->
        <UiSelect
          v-model="priorityFilter"
          :options="TICKET_PRIORITY_OPTIONS"
          size="sm"
          :placeholder="undefined"
        />

        <!-- My Tickets -->
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="showMine"
            type="checkbox"
            class="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary"
          />
          <span class="text-sm text-[var(--text-secondary)]">Только мои</span>
        </label>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary" />
    </div>

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
      <div v-if="tickets.length === 0" class="text-center py-12">
        <Icon name="heroicons:ticket" class="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
        <p class="text-[var(--text-muted)]">Тикетов не найдено</p>
      </div>
    </div>
  </div>
</template>
