<script setup lang="ts">
import type { Chat } from '~/types/admin'
import {
  CHAT_STATUS,
  CHAT_STATUS_OPTIONS,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'
import { useAdminList } from '~/composables/useAdminList'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Чаты поддержки — Админ-панель' })

// Фильтры для списка чатов
interface ChatFilters {
  status: string
  assignedToMe: boolean
}

const {
  items: chats,
  loading,
  filters,
} = useAdminList<Chat, ChatFilters>({
  endpoint: '/api/admin/chat',
  responseKey: 'chats',
  initialFilters: {
    status: 'waiting',
    assignedToMe: false,
  },
  transformParams: f => ({
    status: f.status === 'all' ? null : f.status,
    assignedToMe: f.assignedToMe ? 'true' : null,
  }),
})

// Переход на страницу чата
function goToChat(id: string) {
  navigateTo(`/chat/${id}`)
}
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
      <UiFilterTabs v-model="filters.status" :options="CHAT_STATUS_OPTIONS" />

      <div class="flex items-center gap-2 ml-auto">
        <input
          id="showMine"
          v-model="filters.assignedToMe"
          type="checkbox"
          class="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary"
        />
        <label for="showMine" class="text-sm text-[var(--text-secondary)] cursor-pointer">
          Только мои
        </label>
      </div>
    </div>

    <!-- Loading -->
    <UiLoading v-if="loading" />

    <!-- Chat List -->
    <div v-else class="space-y-3">
      <UiCard
        v-for="chat in chats"
        :key="chat.id"
        :hover="true"
        padding="sm"
        class="cursor-pointer"
        @click="goToChat(chat.id)"
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
              class="w-5 h-5 text-[var(--text-muted)] mt-2"
            />
          </div>
        </div>
      </UiCard>

      <!-- Empty State -->
      <UiEmptyState
        v-if="chats.length === 0"
        :title="filters.status === 'all' ? 'Чатов пока нет' : 'Нет чатов с таким статусом'"
        icon="heroicons:chat-bubble-left-right"
      />
    </div>
  </div>
</template>
