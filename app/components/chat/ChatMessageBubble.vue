<script setup lang="ts">
import type { ChatMessage } from '~/types/admin'

interface Props {
  message: ChatMessage
}

defineProps<Props>()

const { formatFileSize } = useFormatters()

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function isImageAttachment(message: ChatMessage): boolean {
  if (!message.attachmentUrl) return false
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(message.attachmentUrl)
    || (message.attachmentName ? /\.(jpg|jpeg|png|gif|webp)$/i.test(message.attachmentName) : false)
}
</script>

<template>
  <div
    :class="[
      'flex',
      message.senderType === 'admin' || message.senderType === 'bot'
        ? 'justify-end'
        : message.senderType === 'system'
          ? 'justify-center'
          : 'justify-start',
    ]"
  >
    <!-- System Message -->
    <div
      v-if="message.senderType === 'system'"
      class="px-3 py-1 text-xs text-[var(--text-muted)] bg-[var(--glass-bg)] rounded-full"
    >
      {{ message.content }}
    </div>

    <!-- Bot Message -->
    <div
      v-else-if="message.senderType === 'bot'"
      class="max-w-[70%] rounded-2xl px-4 py-2 glass-card rounded-br-md border-l-2 border-[#8B5CF6]/50"
    >
      <div class="flex items-center gap-1.5 mb-1">
        <Icon name="heroicons:cpu-chip" class="w-3.5 h-3.5 text-[#8B5CF6]" />
        <span class="text-xs font-medium text-[#8B5CF6]">{{ message.senderName || 'AI Ассистент' }}</span>
      </div>
      <p v-if="message.content" class="whitespace-pre-wrap break-words text-[var(--text-primary)]">
        {{ message.content }}
      </p>
      <!-- Attachment -->
      <template v-if="message.attachmentUrl">
        <a v-if="isImageAttachment(message)" :href="message.attachmentUrl" target="_blank" class="block mt-2">
          <img
            :src="message.attachmentUrl"
            :alt="message.attachmentName || 'Изображение'"
            class="max-w-full max-h-48 rounded-lg hover:opacity-90 transition-opacity"
          />
        </a>
        <a v-else :href="message.attachmentUrl" target="_blank" class="mt-2 flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <Icon name="heroicons:document" class="w-5 h-5 text-[#8B5CF6]" />
          <div class="flex-1 min-w-0">
            <p class="text-sm truncate">{{ message.attachmentName }}</p>
            <p class="text-xs text-[var(--text-muted)]">{{ formatFileSize(message.attachmentSize) }}</p>
          </div>
          <Icon name="heroicons:arrow-down-tray" class="w-4 h-4 text-[var(--text-muted)]" />
        </a>
      </template>
      <div class="text-xs mt-1 text-[var(--text-muted)]">
        {{ formatTime(message.createdAt) }}
      </div>
    </div>

    <!-- Admin Message -->
    <div
      v-else-if="message.senderType === 'admin'"
      class="max-w-[70%] rounded-2xl px-4 py-2 glass-card rounded-br-md border-l-2 border-primary/50"
    >
      <p v-if="message.content" class="whitespace-pre-wrap break-words text-[var(--text-primary)]">
        {{ message.content }}
      </p>
      <!-- Attachment -->
      <template v-if="message.attachmentUrl">
        <a v-if="isImageAttachment(message)" :href="message.attachmentUrl" target="_blank" class="block mt-2">
          <img
            :src="message.attachmentUrl"
            :alt="message.attachmentName || 'Изображение'"
            class="max-w-full max-h-48 rounded-lg hover:opacity-90 transition-opacity"
          />
        </a>
        <a v-else :href="message.attachmentUrl" target="_blank" class="mt-2 flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <Icon name="heroicons:document" class="w-5 h-5 text-primary" />
          <div class="flex-1 min-w-0">
            <p class="text-sm truncate">{{ message.attachmentName }}</p>
            <p class="text-xs text-[var(--text-muted)]">{{ formatFileSize(message.attachmentSize) }}</p>
          </div>
          <Icon name="heroicons:arrow-down-tray" class="w-4 h-4 text-[var(--text-muted)]" />
        </a>
      </template>
      <div class="text-xs mt-1 text-[var(--text-muted)]">
        {{ formatTime(message.createdAt) }}
        <span v-if="message.senderName" class="ml-1 text-primary">
          · {{ message.senderName }}
        </span>
      </div>
    </div>

    <!-- User Message -->
    <div
      v-else
      class="max-w-[70%] rounded-2xl px-4 py-2 glass-card rounded-bl-md"
    >
      <p v-if="message.content" class="whitespace-pre-wrap break-words">
        {{ message.content }}
      </p>
      <!-- Attachment -->
      <template v-if="message.attachmentUrl">
        <a v-if="isImageAttachment(message)" :href="message.attachmentUrl" target="_blank" class="block mt-2">
          <img
            :src="message.attachmentUrl"
            :alt="message.attachmentName || 'Изображение'"
            class="max-w-full max-h-48 rounded-lg hover:opacity-90 transition-opacity"
          />
        </a>
        <a v-else :href="message.attachmentUrl" target="_blank" class="mt-2 flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <Icon name="heroicons:document" class="w-5 h-5 text-accent" />
          <div class="flex-1 min-w-0">
            <p class="text-sm truncate">{{ message.attachmentName }}</p>
            <p class="text-xs text-[var(--text-muted)]">{{ formatFileSize(message.attachmentSize) }}</p>
          </div>
          <Icon name="heroicons:arrow-down-tray" class="w-4 h-4 text-[var(--text-muted)]" />
        </a>
      </template>
      <div class="text-xs mt-1 text-[var(--text-muted)]">
        {{ formatTime(message.createdAt) }}
      </div>
    </div>
  </div>
</template>
