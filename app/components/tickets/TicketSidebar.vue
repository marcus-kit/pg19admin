<script setup lang="ts">
import type { Ticket, TicketHistoryItem } from '~/types/admin'
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  TICKET_CATEGORY,
  getStatusLabel
} from '~/composables/useStatusConfig'

interface Props {
  ticket: Ticket
  history: TicketHistoryItem[]
  saving?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  updateStatus: [status: string]
  updatePriority: [priority: string]
}>()

const showHistory = ref(false)

const statusOptions = [
  { value: 'new', label: 'Новый' },
  { value: 'open', label: 'В работе' },
  { value: 'pending', label: 'Ожидает ответа' },
  { value: 'resolved', label: 'Решён' },
  { value: 'closed', label: 'Закрыт' }
]

const priorityOptions = [
  { value: 'low', label: 'Низкий' },
  { value: 'normal', label: 'Обычный' },
  { value: 'high', label: 'Высокий' },
  { value: 'urgent', label: 'Срочный' }
]

const ticketStatus = computed({
  get: () => props.ticket.status,
  set: (value: string) => emit('updateStatus', value)
})

const ticketPriority = computed({
  get: () => props.ticket.priority,
  set: (value: string) => emit('updatePriority', value)
})

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    status_change: 'Изменён статус',
    priority_change: 'Изменён приоритет',
    assigned: 'Назначен',
    unassigned: 'Снято назначение'
  }
  return labels[action] || action
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Status & Priority -->
    <UiCard>
      <template #header>
        <span class="font-medium text-[var(--text-primary)]">Статус</span>
      </template>

      <div class="space-y-4">
        <UiSelect
          v-model="ticketStatus"
          :options="statusOptions"
          label="Статус"
          size="sm"
          :disabled="saving"
          :placeholder="undefined"
        />

        <UiSelect
          v-model="ticketPriority"
          :options="priorityOptions"
          label="Приоритет"
          size="sm"
          :disabled="saving || ticket.status === 'closed'"
          :placeholder="undefined"
        />

        <div>
          <label class="block text-xs text-[var(--text-muted)] mb-1">Категория</label>
          <p class="text-[var(--text-primary)]">
            {{ getStatusLabel(TICKET_CATEGORY, ticket.category) }}
          </p>
        </div>

        <div>
          <label class="block text-xs text-[var(--text-muted)] mb-1">Назначен</label>
          <p class="text-[var(--text-primary)]">
            {{ ticket.assignedAdmin?.fullName || '—' }}
          </p>
        </div>
      </div>
    </UiCard>

    <!-- User Info -->
    <UiCard>
      <template #header>
        <span class="font-medium text-[var(--text-primary)]">Пользователь</span>
      </template>

      <div class="space-y-3 text-sm">
        <div v-if="ticket.userName">
          <span class="text-[var(--text-muted)]">Имя:</span>
          <span class="ml-2 text-[var(--text-primary)]">{{ ticket.userName }}</span>
        </div>
        <div v-if="ticket.userEmail">
          <span class="text-[var(--text-muted)]">Email:</span>
          <a :href="`mailto:${ticket.userEmail}`" class="ml-2 text-primary hover:underline">
            {{ ticket.userEmail }}
          </a>
        </div>
      </div>
    </UiCard>

    <!-- Timeline / History -->
    <UiCard>
      <template #header>
        <button
          @click="showHistory = !showHistory"
          class="flex items-center justify-between w-full"
        >
          <span class="font-medium text-[var(--text-primary)]">История</span>
          <Icon
            :name="showHistory ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
            class="w-4 h-4 text-[var(--text-muted)]"
          />
        </button>
      </template>

      <div v-if="showHistory" class="space-y-3">
        <div
          v-for="item in history"
          :key="item.id"
          class="text-sm border-l-2 border-[var(--glass-border)] pl-3"
        >
          <p class="text-[var(--text-primary)]">{{ getActionLabel(item.action) }}</p>
          <p v-if="item.oldValue || item.newValue" class="text-xs text-[var(--text-muted)]">
            <span v-if="item.oldValue">{{ item.oldValue }}</span>
            <span v-if="item.oldValue && item.newValue"> → </span>
            <span v-if="item.newValue">{{ item.newValue }}</span>
          </p>
          <p class="text-xs text-[var(--text-muted)]">
            {{ item.adminName }} · {{ formatDate(item.createdAt) }}
          </p>
        </div>

        <div v-if="history.length === 0" class="text-sm text-[var(--text-muted)]">
          Нет записей
        </div>
      </div>
    </UiCard>
  </div>
</template>
