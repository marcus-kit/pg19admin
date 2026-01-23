<script setup lang="ts">
import type { Chat } from '~/types/admin'
import {
  CHAT_STATUS,
  CHAT_STATUS_OPTIONS,
  getStatusLabel,
  getStatusBadgeClass
} from '~/composables/useStatusConfig'

definePageMeta({
  middleware: 'admin'
})

useHead({ title: 'Чаты поддержки — Админ-панель' })

const toast = useToast()
const router = useRouter()

const loading = ref(true)
const chats = ref<Chat[]>([])
const statusFilter = ref<string>('waiting')
const showMine = ref(false)

// Custom fetch logic due to special filter behavior
const fetchChats = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (statusFilter.value !== 'all') {
      params.set('status', statusFilter.value)
    }
    if (showMine.value) {
      params.set('assignedToMe', 'true')
    }

    const data = await $fetch<{ chats: Chat[] }>(`/api/admin/chat?${params}`)
    chats.value = data.chats
  } catch (error) {
    console.error('Failed to fetch chats:', error)
    toast.error('Не удалось загрузить чаты')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchChats()
})

watch([statusFilter, showMine], () => {
  fetchChats()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <h1 class="text-3xl font-bold text-[var(--text-primary)]">
        Чаты поддержки
      </h1>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <div class="flex gap-2">
        <UiButton
          v-for="opt in CHAT_STATUS_OPTIONS"
          :key="opt.value"
          variant="ghost"
          size="sm"
          :class="{ 'bg-primary/20': statusFilter === opt.value }"
          @click="statusFilter = opt.value"
        >
          {{ opt.label }}
        </UiButton>
      </div>

      <div class="flex items-center gap-2 ml-auto">
        <input
          id="showMine"
          v-model="showMine"
          type="checkbox"
          class="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary"
        />
        <label for="showMine" class="text-sm text-[var(--text-secondary)] cursor-pointer">
          Только мои
        </label>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Chat List -->
    <div v-else class="space-y-3">
      <div
        v-for="chat in chats"
        :key="chat.id"
        class="glass-card p-4 rounded-lg cursor-pointer hover:border-primary/50 transition-all group"
        @click="router.push(`/chat/${chat.id}`)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="font-medium text-[var(--text-primary)]">
                {{ chat.userName || `Чат #${chat.id}` }}
              </span>
              <span v-if="chat.guestContact" class="text-xs text-[var(--text-muted)]">
                ({{ chat.guestContact }})
              </span>
              <UiBadge v-if="chat.guestName && !chat.userId" class="bg-purple-500/20 text-purple-400" size="sm">
                Гость
              </UiBadge>
              <UiBadge :class="getStatusBadgeClass(CHAT_STATUS, chat.status)" size="sm">
                {{ getStatusLabel(CHAT_STATUS, chat.status) }}
              </UiBadge>
              <span
                v-if="chat.unreadAdminCount > 0"
                class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full"
              >
                {{ chat.unreadAdminCount > 9 ? '9+' : chat.unreadAdminCount }}
              </span>
            </div>

            <p v-if="chat.subject" class="text-sm text-[var(--text-secondary)] truncate mb-1">
              {{ chat.subject }}
            </p>

            <div class="flex items-center gap-3 text-xs text-[var(--text-muted)]">
              <span v-if="chat.assignedAdmin" class="flex items-center gap-1">
                <Icon name="heroicons:user" class="w-3 h-3" />
                {{ chat.assignedAdmin.fullName }}
              </span>
              <span v-if="chat.userTelegramId" class="flex items-center gap-1">
                <Icon name="simple-icons:telegram" class="w-3 h-3" />
                {{ chat.userTelegramId }}
              </span>
            </div>
          </div>

          <div class="text-right shrink-0">
            <span class="text-xs text-[var(--text-muted)]">
              <UiRelativeTime :date="chat.lastMessageAt" />
            </span>
            <Icon
              name="heroicons:chevron-right"
              class="w-5 h-5 text-[var(--text-muted)] mt-2 group-hover:text-primary transition-colors"
            />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="chats.length === 0" class="text-center py-12">
        <Icon name="heroicons:chat-bubble-left-right" class="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
        <p class="text-[var(--text-muted)]">
          {{ statusFilter === 'all' ? 'Чатов пока нет' : 'Нет чатов с таким статусом' }}
        </p>
      </div>
    </div>
  </div>
</template>
