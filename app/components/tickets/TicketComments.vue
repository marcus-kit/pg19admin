<script setup lang="ts">
import type { TicketComment } from '~/types/admin'

interface Props {
  comments: TicketComment[]
  disabled?: boolean
  saving?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  addComment: [content: string, isInternal: boolean]
}>()

const newComment = ref('')
const isInternal = ref(false)

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleSubmit = () => {
  if (!newComment.value.trim()) return
  emit('addComment', newComment.value.trim(), isInternal.value)
  newComment.value = ''
  isInternal.value = false
}
</script>

<template>
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
            : 'bg-[var(--glass-bg)] border border-[var(--glass-border)]'
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
          <span class="text-xs text-[var(--text-muted)]">{{ formatDate(comment.createdAt) }}</span>
        </div>
        <p class="text-[var(--text-secondary)] whitespace-pre-wrap">{{ comment.content }}</p>
      </div>

      <div v-if="comments.length === 0" class="text-center py-4 text-[var(--text-muted)]">
        Комментариев пока нет
      </div>
    </div>

    <!-- Add Comment -->
    <div v-if="!disabled" class="mt-6 pt-4 border-t border-[var(--glass-border)]">
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
          @click="handleSubmit"
          :loading="saving"
          :disabled="!newComment.trim() || saving"
        >
          Отправить
        </UiButton>
      </div>
    </div>
  </UiCard>
</template>
