<script setup lang="ts">
import type { Ticket, TicketComment, TicketHistoryItem } from '~/types/admin'
import { getErrorStatusCode, formatDateTime } from '~/composables/useFormatters'
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  TICKET_CATEGORY,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'

definePageMeta({
  middleware: 'admin',
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const user = useSupabaseUser()

const loading = ref(true)
const saving = ref(false)
const ticket = ref<(Ticket & { description?: string }) | null>(null)

useHead({ title: computed(() => ticket.value ? `Тикет ${ticket.value.number} — Админ-панель` : 'Тикет — Админ-панель') })
const comments = ref<TicketComment[]>([])
const history = ref<TicketHistoryItem[]>([])

const newComment = ref('')
const isInternal = ref(false)
const showHistory = ref(false)

const ticketId = computed(() => route.params.id as string)

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

async function fetchTicket() {
  loading.value = true
  try {
    const data = await $fetch<{ ticket: Ticket & { description?: string }, comments: TicketComment[], history: TicketHistoryItem[] }>(
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

async function handleAddComment() {
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

async function handleUpdateStatus(newStatus: string) {
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

async function handleUpdatePriority(newPriority: string) {
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

async function handleAssignToMe() {
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

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    status_change: 'Изменён статус',
    priority_change: 'Изменён приоритет',
    assigned: 'Назначен',
    unassigned: 'Снято назначение',
  }
  return labels[action] || action
}

function cancel() {
  router.push('/tickets')
}

// Кнопка «Стрелка вверх»
const pageRootRef = ref<HTMLElement | null>(null)
const { showScrollTop, scrollToTop } = useScrollToTop(pageRootRef)

onMounted(() => {
  fetchTicket()
})
</script>

<template>
  <div ref="pageRootRef" class="ticket-detail-page">
    <header class="ticket-detail-page__hero">
      <div class="ticket-detail-page__hero-bg" aria-hidden="true" />
      <div class="ticket-detail-page__hero-inner">
        <div class="ticket-detail-page__hero-row">
          <button type="button" class="ticket-detail-page__back" aria-label="Назад" @click="cancel">
            <Icon name="heroicons:arrow-left" class="w-5 h-5" />
          </button>
          <div class="ticket-detail-page__hero-head">
            <div class="ticket-detail-page__hero-icon">
              <Icon name="heroicons:ticket" class="w-7 h-7 text-primary" />
            </div>
            <div class="ticket-detail-page__hero-title-wrap">
              <h1 class="ticket-detail-page__hero-title">
                {{ ticket ? ticket.number : 'Тикет' }}
              </h1>
              <p class="ticket-detail-page__hero-subject">
                {{ ticket?.subject || '—' }}
              </p>
            </div>
          </div>
          <button
            v-if="ticket && !ticket.assignedAdmin && ticket.status !== 'closed'"
            type="button"
            class="ticket-detail-page__btn-assign"
            :disabled="saving"
            @click="handleAssignToMe"
          >
            <Icon name="heroicons:hand-raised" class="w-4 h-4" />
            <span>Взять себе</span>
          </button>
        </div>
        <div v-if="ticket" class="ticket-detail-page__hero-badges">
          <UiBadge :class="getStatusBadgeClass(TICKET_STATUS, ticket.status)" size="sm">
            {{ getStatusLabel(TICKET_STATUS, ticket.status) }}
          </UiBadge>
          <UiBadge :class="getStatusBadgeClass(TICKET_PRIORITY, ticket.priority)" size="sm">
            {{ getStatusLabel(TICKET_PRIORITY, ticket.priority) }}
          </UiBadge>
          <UiBadge :class="getStatusBadgeClass(TICKET_CATEGORY, ticket.category)" size="sm">
            {{ getStatusLabel(TICKET_CATEGORY, ticket.category) }}
          </UiBadge>
        </div>
      </div>
    </header>

    <UiLoading v-if="loading" class="ticket-detail-page__loading" />

    <template v-else-if="ticket">
      <div class="ticket-detail-page__layout">
        <div class="ticket-detail-page__main">
          <!-- Описание -->
          <section class="ticket-detail-page__card glass-card glass-card-static">
            <div class="ticket-detail-page__card-head">
              <h2 class="ticket-detail-page__card-title">Описание</h2>
              <span class="ticket-detail-page__card-date">{{ formatDateTime(ticket.createdAt) }}</span>
            </div>
            <p class="ticket-detail-page__description">{{ ticket.description || '—' }}</p>
          </section>

          <!-- Комментарии -->
          <section class="ticket-detail-page__card glass-card glass-card-static">
            <h2 class="ticket-detail-page__card-title">Комментарии ({{ comments.length }})</h2>

            <div class="ticket-detail-page__comments">
              <div
                v-for="comment in comments"
                :key="comment.id"
                class="ticket-detail-page__comment"
                :class="{
                  'ticket-detail-page__comment--admin': comment.authorType === 'admin' && !comment.isInternal,
                  'ticket-detail-page__comment--internal': comment.isInternal,
                  'ticket-detail-page__comment--user': comment.authorType === 'user',
                }"
              >
                <div class="ticket-detail-page__comment-head">
                  <span class="ticket-detail-page__comment-author">
                    {{ comment.authorName || (comment.authorType === 'user' ? 'Пользователь' : 'Система') }}
                  </span>
                  <UiBadge v-if="comment.isInternal" class="ticket-detail-page__badge-internal" size="sm">
                    Внутренний
                  </UiBadge>
                  <span class="ticket-detail-page__comment-date">{{ formatDateTime(comment.createdAt) }}</span>
                </div>
                <p class="ticket-detail-page__comment-content">{{ comment.content }}</p>
              </div>

              <p v-if="comments.length === 0" class="ticket-detail-page__comments-empty">
                Комментариев пока нет
              </p>
            </div>

            <div v-if="ticket.status !== 'closed'" class="ticket-detail-page__add-comment">
              <textarea
                v-model="newComment"
                placeholder="Добавить комментарий..."
                rows="3"
                class="ticket-detail-page__textarea"
              />
              <div class="ticket-detail-page__add-comment-actions">
                <label class="ticket-detail-page__checkbox-wrap">
                  <input v-model="isInternal" type="checkbox" class="ticket-detail-page__checkbox">
                  <span class="ticket-detail-page__checkbox-label">Внутренний комментарий</span>
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
          </section>
        </div>

        <aside class="ticket-detail-page__sidebar">
          <!-- Статус и приоритет -->
          <section class="ticket-detail-page__card glass-card glass-card-static">
            <h2 class="ticket-detail-page__card-title">Статус</h2>
            <div class="ticket-detail-page__sidebar-fields">
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
              <div class="ticket-detail-page__field">
                <span class="ticket-detail-page__field-label">Категория</span>
                <span class="ticket-detail-page__field-value">{{ getStatusLabel(TICKET_CATEGORY, ticket.category) }}</span>
              </div>
              <div class="ticket-detail-page__field">
                <span class="ticket-detail-page__field-label">Назначен</span>
                <span class="ticket-detail-page__field-value">{{ ticket.assignedAdmin?.fullName || '—' }}</span>
              </div>
            </div>
          </section>

          <!-- Пользователь -->
          <section class="ticket-detail-page__card glass-card glass-card-static">
            <h2 class="ticket-detail-page__card-title">Пользователь</h2>
            <div class="ticket-detail-page__sidebar-fields">
              <div v-if="ticket.userName" class="ticket-detail-page__field">
                <span class="ticket-detail-page__field-label">Имя</span>
                <span class="ticket-detail-page__field-value">{{ ticket.userName }}</span>
              </div>
              <div v-if="ticket.userEmail" class="ticket-detail-page__field">
                <span class="ticket-detail-page__field-label">Email</span>
                <a :href="`mailto:${ticket.userEmail}`" class="ticket-detail-page__link">{{ ticket.userEmail }}</a>
              </div>
            </div>
          </section>

          <!-- История -->
          <section class="ticket-detail-page__card glass-card glass-card-static">
            <button
              type="button"
              class="ticket-detail-page__card-toggle"
              @click="showHistory = !showHistory"
            >
              <span class="ticket-detail-page__card-title">История</span>
              <Icon
                :name="showHistory ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
                class="ticket-detail-page__toggle-icon"
              />
            </button>

            <div v-if="showHistory" class="ticket-detail-page__history">
              <div
                v-for="item in history"
                :key="item.id"
                class="ticket-detail-page__history-item"
              >
                <p class="ticket-detail-page__history-action">{{ getActionLabel(item.action) }}</p>
                <p v-if="item.oldValue || item.newValue" class="ticket-detail-page__history-values">
                  <span v-if="item.oldValue">{{ item.oldValue }}</span>
                  <span v-if="item.oldValue && item.newValue"> → </span>
                  <span v-if="item.newValue">{{ item.newValue }}</span>
                </p>
                <p class="ticket-detail-page__history-meta">
                  {{ item.adminName }} · {{ formatDateTime(item.createdAt) }}
                </p>
              </div>

              <p v-if="history.length === 0" class="ticket-detail-page__history-empty">
                Нет записей
              </p>
            </div>
          </section>
        </aside>
      </div>

      <Transition name="ticket-detail-page-scroll-top">
        <button
          v-if="showScrollTop"
          type="button"
          class="ticket-detail-page__scroll-top"
          aria-label="Прокрутить вверх"
          @click="scrollToTop"
        >
          <Icon name="heroicons:arrow-up" class="w-5 h-5" />
        </button>
      </Transition>
    </template>
  </div>
</template>
