<script setup lang="ts">
import type { Chat } from '~/types/admin'

interface Props {
  chat: Chat
  loading?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  back: []
  assignToMe: []
  close: []
}>()
</script>

<template>
  <div class="flex items-center justify-between gap-4 pb-2 border-b border-[var(--glass-border)]">
    <div class="flex items-center gap-3">
      <UiButton variant="ghost" size="sm" @click="emit('back')">
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </UiButton>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-lg font-semibold text-[var(--text-primary)]">
            {{ chat.userName || chat.guestName || `Чат #${chat.id}` }}
          </h1>
          <UiBadge v-if="chat.guestName && !chat.userId" class="bg-purple-500/20 text-purple-400" size="sm">
            Гость
          </UiBadge>
        </div>
        <div class="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span v-if="chat.guestContact">
            {{ chat.guestContact }}
          </span>
          <span v-if="chat.userTelegramId">
            Telegram: {{ chat.userTelegramId }}
          </span>
          <span v-if="chat.assignedAdmin">
            · {{ chat.assignedAdmin.fullName }}
          </span>
        </div>
      </div>
    </div>

    <div class="flex gap-2">
      <UiButton
        v-if="!chat.assignedAdmin && chat.status !== 'closed'"
        variant="secondary"
        size="sm"
        @click="emit('assignToMe')"
      >
        <Icon name="heroicons:hand-raised" class="w-4 h-4" />
        Взять себе
      </UiButton>
      <UiButton
        v-if="chat.status !== 'closed'"
        variant="ghost"
        size="sm"
        @click="emit('close')"
      >
        <Icon name="heroicons:x-circle" class="w-4 h-4 text-red-400" />
        Закрыть
      </UiButton>
    </div>
  </div>
</template>
