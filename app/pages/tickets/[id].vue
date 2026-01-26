<script setup lang="ts">
import type { Ticket, TicketComment, TicketHistoryItem } from '~/types/admin'
import { getErrorStatusCode, formatDateTime } from '~/composables/useFormatters'
import {
  TICKET_CATEGORY,
  getStatusLabel,
} from '~/composables/useStatusConfig'

definePageMeta({
  middleware: 'admin',
})

const route = useRoute()
const router = useRouter()
const ticketId = computed(() => route.params.id as string)
const toast = useToast()
const user = useSupabaseUser()

useHead({ title: 'Тикет — Админ-панель' })

const loading = ref(true)
const saving = ref(false)
const ticket = ref<Ticket | null>(null)
const comments = ref<TicketComment[]>([])
const history = ref<TicketHistoryItem[]>([])

// Comments state
const newComment = ref('')
const isInternal = ref(false)

// Sidebar state
const showHistory = ref(false)

const statusOptions = [
  { value: 'new', label: 'Новый' },
  { value: 'open', label: 'В работе' },
  { value: 'pending', label: 'Ожидает ответа' },
  { value: 'resolved', label: 'Решён' },
  { value: 'closed', label: 'Закрыт' },
]

const priorityOptions = [
  { value: 'low', label: 'Низкий' },
  { value: 'normal', label: 'Обычный' },
  { value: 'high', label: 'Высокий' },
  { value: 'urgent', label: 'Срочный' },
]

const ticketStatus = computed({
  get: () => ticket.value?.status || 'new',
  set: (value: string) => handleUpdateStatus(value),
})

const ticketPriority = computed({
  get: () => ticket.value?.priority || 'normal',
  set: (value: string) => handleUpdatePriority(value),
})

const fetchTicket = async () => {
  loading.value = true
  try {
    const data = await $fetch<{ ticket: Ticket, comments: TicketComment[], history: TicketHistoryItem[] }>(
      `/api/admin/tickets/${ticketId.value}`,
    )
    ticket.value = data.ticket
    comments.value = data.comments
    history.value = data.history
  }
  catch (error: unknown) {
    toast.error('Не удалось загрузить тикет')
    if (getErrorStatusCode(error) === 404) {
      router.push('/tickets')
    }
  }
  finally {
    loading.value = false
  }
}

const handleAddComment = async () => {
  if (!newComment.value.trim() || saving.value) return

  saving.value = true
  try {
    const response = await $fetch<{ comment: TicketComment }>(`/api/admin/tickets/${ticketId.value}/comment`, {
      method: 'POST',
      body: { content: newComment.value.trim(), isInternal: isInternal.value },
    })

    comments.value.push(response.comment)
    newComment.value = ''
    isInternal.value = false

    if (ticket.value?.status === 'new') {
      ticket.value.status = 'open'
    }
  }
  catch {
    toast.error('Ошибка при добавлении комментария')
  }
  finally {
    saving.value = false
  }
}

const handleUpdateStatus = async (newStatus: string) => {
  if (!ticket.value || saving.value) return

  saving.value = true
  try {
    await $fetch(`/api/admin/tickets/${ticketId.value}/status`, {
      method: 'PUT',
      body: { status: newStatus },
    })

    ticket.value.status = newStatus as Ticket['status']
    await fetchTicket()
  }
  catch {
    toast.error('Ошибка при обновлении статуса')
  }
  finally {
    saving.value = false
  }
}

const handleUpdatePriority = async (newPriority: string) => {
  if (!ticket.value || saving.value) return

  saving.value = true
  try {
    await $fetch(`/api/admin/tickets/${ticketId.value}/priority`, {
      method: 'PUT',
      body: { priority: newPriority },
    })

    ticket.value.priority = newPriority as Ticket['priority']
  }
  catch {
    toast.error('Ошибка при обновлении приоритета')
  }
  finally {
    saving.value = false
  }
}

const handleAssignToMe = async () => {
  if (!user.value || saving.value) return

  saving.value = true
  try {
    await $fetch(`/api/admin/tickets/${ticketId.value}/assign`, {
      method: 'POST',
      body: { adminId: user.value.sub },
    })

    await fetchTicket()
  }
  catch {
    toast.error('Ошибка при назначении тикета')
  }
  finally {
    saving.value = false
  }
}

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    status_change: 'Изменён статус',
    priority_change: 'Изменён приоритет',
    assigned: 'Назначен',
    unassigned: 'Снято назначение',
  }
  return labels[action] || action
}

onMounted(() => {
  fetchTicket()
})
</script>

<template>
  <div>
    <!-- Loading -->
    <UiLoading v-if="loading" />

    <template v-else-if="ticket">
      <!-- Header (бывший TicketDetailHeader) -->
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <UiButton variant="ghost" size="sm" @click="router.push('/tickets')">
              <Icon name="heroicons:arrow-left" class="w-5 h-5" />
            </UiButton>
            <span class="font-mono text-primary">{{ ticket.number }}</span>
          </div>
          <h1 class="text-2xl font-bold text-[var(--text-primary)]">
            {{ ticket.subject }}
          </h1>
        </div>

        <div class="flex gap-2">
          <UiButton
            v-if="!ticket.assignedAdmin && ticket.status !== 'closed'"
            :disabled="saving"
            variant="secondary"
            size="sm"
            @click="handleAssignToMe"
          >
            <Icon name="heroicons:hand-raised" class="w-4 h-4" />
            Взять себе
          </UiButton>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Description -->
          <UiCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-medium text-[var(--text-primary)]">Описание</span>
                <span class="text-xs text-[var(--text-muted)]">{{ formatDateTime(ticket.createdAt) }}</span>
              </div>
            </template>
            <p class="text-[var(--text-secondary)] whitespace-pre-wrap">{{ ticket.description }}</p>
          </UiCard>

          <!-- Comments (бывший TicketComments) -->
          <UiCard>
            <template #header>
              <span class="font-medium text-[var(--text-primary)]">
                Комментарии ({{ comments.length }})
              </span>
            </template>

            <div class="space-y-4">
              <div
                v-for="comment in comments"
                :key="comment.id"
                :class="[
                  'p-4 rounded-lg',
                  comment.authorType === 'admin'
                    ? comment.isInternal
                      ? 'bg-yellow-500/10 border border-yellow-500/20'
                      : 'bg-primary/10 border border-primary/20'
                    : 'bg-[var(--glass-bg)] border border-[var(--glass-border)]',
                ]"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-[var(--text-primary)]">
                      {{ comment.authorName || (comment.authorType === 'user' ? 'Пользователь' : 'Система') }}
                    </span>
                    <UiBadge v-if="comment.isInternal" class="bg-yellow-500/20 text-yellow-400" size="sm">
                      Внутренний
                    </UiBadge>
                  </div>
                  <span class="text-xs text-[var(--text-muted)]">{{ formatDateTime(comment.createdAt) }}</span>
                </div>
                <p class="text-[var(--text-secondary)] whitespace-pre-wrap">{{ comment.content }}</p>
              </div>

              <div v-if="comments.length === 0" class="text-center py-4 text-[var(--text-muted)]">
                Комментариев пока нет
              </div>
            </div>

            <!-- Add Comment -->
            <div v-if="ticket.status !== 'closed'" class="mt-6 pt-4 border-t border-[var(--glass-border)]">
              <textarea
                v-model="newComment"
                placeholder="Добавить комментарий..."
                rows="3"
                class="w-full px-4 py-3 glass-card rounded-lg text-[var(--text-primary)] border border-[var(--glass-border)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-[var(--glass-bg)] resize-none mb-3"
              />
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="isInternal"
                    type="checkbox"
                    class="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-yellow-500 focus:ring-yellow-500"
                  />
                  <span class="text-sm text-[var(--text-secondary)]">Внутренний комментарий</span>
                </label>
                <UiButton
                  :loading="saving"
                  :disabled="!newComment.trim() || saving"
                  @click="handleAddComment"
                >
                  Отправить
                </UiButton>
              </div>
            </div>
          </UiCard>
        </div>

        <!-- Sidebar (бывший TicketSidebar) -->
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
                :disabled="saving"
                :placeholder="undefined"
                label="Статус"
                size="sm"
              />

              <UiSelect
                v-model="ticketPriority"
                :options="priorityOptions"
                :disabled="saving || ticket.status === 'closed'"
                :placeholder="undefined"
                label="Приоритет"
                size="sm"
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
                class="flex items-center justify-between w-full"
                @click="showHistory = !showHistory"
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
                  {{ item.adminName }} · {{ formatDateTime(item.createdAt) }}
                </p>
              </div>

              <div v-if="history.length === 0" class="text-sm text-[var(--text-muted)]">
                Нет записей
              </div>
            </div>
          </UiCard>
        </div>
      </div>
    </template>
  </div>
</template>
