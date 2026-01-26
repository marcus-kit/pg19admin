<script setup lang="ts">
import type { Ticket, TicketComment, TicketHistoryItem } from '~/types/admin'
import { getErrorStatusCode } from '~/composables/useFormatters'

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

const handleAddComment = async (content: string, isInternal: boolean) => {
  if (saving.value) return

  saving.value = true
  try {
    const response = await $fetch<{ comment: TicketComment }>(`/api/admin/tickets/${ticketId.value}/comment`, {
      method: 'POST',
      body: { content, isInternal },
    })

    comments.value.push(response.comment)

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

const formatFullDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
      <!-- Header -->
      <TicketDetailHeader
        :ticket="ticket"
        :saving="saving"
        @back="router.push('/tickets')"
        @assign-to-me="handleAssignToMe"
      />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Description -->
          <UiCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-medium text-[var(--text-primary)]">Описание</span>
                <span class="text-xs text-[var(--text-muted)]">{{ formatFullDate(ticket.createdAt) }}</span>
              </div>
            </template>
            <p class="text-[var(--text-secondary)] whitespace-pre-wrap">{{ ticket.description }}</p>
          </UiCard>

          <!-- Comments -->
          <TicketComments
            :comments="comments"
            :disabled="ticket.status === 'closed'"
            :saving="saving"
            @add-comment="handleAddComment"
          />
        </div>

        <!-- Sidebar -->
        <TicketSidebar
          :ticket="ticket"
          :history="history"
          :saving="saving"
          @update-status="handleUpdateStatus"
          @update-priority="handleUpdatePriority"
        />
      </div>
    </template>
  </div>
</template>
