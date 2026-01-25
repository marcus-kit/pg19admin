<script setup lang="ts">
interface Props {
  disabled?: boolean
  sending?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  send: [content: string, file: File | null]
}>()

const { formatFileSize } = useFormatters()

const newMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)
const pendingPreview = ref<string | null>(null)

const ACCEPT_FILES = 'image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx,.xls,.xlsx'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const openFileDialog = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  input.value = ''

  if (file.size > MAX_FILE_SIZE) {
    alert('Размер файла не должен превышать 10 МБ')
    return
  }

  pendingFile.value = file

  if (file.type.startsWith('image/')) {
    pendingPreview.value = URL.createObjectURL(file)
  }
  else {
    pendingPreview.value = null
  }
}

const removePendingFile = () => {
  pendingFile.value = null
  if (pendingPreview.value) {
    URL.revokeObjectURL(pendingPreview.value)
    pendingPreview.value = null
  }
}

const handleSubmit = () => {
  if ((!newMessage.value.trim() && !pendingFile.value)) return

  emit('send', newMessage.value.trim(), pendingFile.value)
  newMessage.value = ''
  removePendingFile()
}

const handleTextareaInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  target.style.height = 'auto'
  target.style.height = Math.min(target.scrollHeight, 120) + 'px'
}

onUnmounted(() => {
  if (pendingPreview.value) {
    URL.revokeObjectURL(pendingPreview.value)
  }
})
</script>

<template>
  <div class="pt-2 border-t border-[var(--glass-border)]">
    <!-- Pending file preview -->
    <div v-if="pendingFile" class="mb-2 p-2 rounded-lg bg-white/5 flex items-center gap-2">
      <img
        v-if="pendingPreview"
        :src="pendingPreview"
        class="w-12 h-12 rounded object-cover flex-shrink-0"
      />
      <div v-else class="w-12 h-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon name="heroicons:document" class="w-6 h-6 text-primary" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm truncate text-[var(--text-primary)]">{{ pendingFile.name }}</p>
        <p class="text-xs text-[var(--text-muted)]">{{ formatFileSize(pendingFile.size) }}</p>
      </div>
      <button
        class="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
        title="Удалить"
        @click="removePendingFile"
      >
        <Icon name="heroicons:x-mark" class="w-4 h-4 text-[var(--text-muted)]" />
      </button>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      :accept="ACCEPT_FILES"
      type="file"
      class="hidden"
      @change="handleFileSelect"
    />

    <form class="flex gap-2" @submit.prevent="handleSubmit">
      <!-- Attach button -->
      <UiButton
        :disabled="disabled || sending"
        type="button"
        variant="ghost"
        title="Прикрепить файл"
        @click="openFileDialog"
      >
        <Icon name="heroicons:paper-clip" class="w-5 h-5" />
      </UiButton>

      <textarea
        v-model="newMessage"
        :disabled="disabled || sending"
        placeholder="Введите сообщение..."
        rows="1"
        class="flex-1 px-3 py-2 glass-card rounded-lg text-[var(--text-primary)] border border-[var(--glass-border)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-[var(--glass-bg)] resize-none min-h-[40px] max-h-[120px]"
        @keydown.enter.exact.prevent="handleSubmit"
        @input="handleTextareaInput"
      />

      <UiButton
        :loading="sending"
        :disabled="(!newMessage.trim() && !pendingFile) || disabled || sending"
        type="submit"
      >
        <Icon name="heroicons:paper-airplane" class="w-5 h-5" />
      </UiButton>
    </form>
  </div>
</template>
