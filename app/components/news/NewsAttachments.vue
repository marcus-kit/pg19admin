<script setup lang="ts">
const toast = useToast()

interface Attachment {
  id: string
  fileName: string
  filePath: string
  mimeType?: string
}

const props = defineProps<{
  newsId: string
  attachments: Attachment[]
}>()

const emit = defineEmits<{
  update: [attachments: Attachment[]]
}>()

const uploading = ref(false)
const deleting = ref<string | null>(null)
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const localAttachments = computed({
  get: () => props.attachments,
  set: val => emit('update', val),
})

const getFileIcon = (mimeType?: string) => {
  if (!mimeType) return 'heroicons:document'
  if (mimeType.startsWith('image/')) return 'heroicons:photo'
  if (mimeType.includes('pdf')) return 'heroicons:document-text'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'heroicons:document-text'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'heroicons:table-cells'
  return 'heroicons:document'
}

const handleDrop = async (e: DragEvent) => {
  dragOver.value = false
  const files = e.dataTransfer?.files
  if (files?.length) {
    await uploadFiles(Array.from(files))
  }
}

const handleFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    await uploadFiles(Array.from(target.files))
    target.value = '' // Reset input
  }
}

const uploadFiles = async (files: File[]) => {
  uploading.value = true

  for (const file of files) {
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`Файл "${file.name}" превышает 10 МБ`)
      continue
    }

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await $fetch<{ success: boolean, attachment: Attachment }>(
        `/api/admin/news/${props.newsId}/attachments`,
        {
          method: 'POST',
          body: formData,
        },
      )

      if (response.success && response.attachment) {
        localAttachments.value = [...localAttachments.value, response.attachment]
        toast.success(`Файл "${file.name}" загружен`)
      }
    }
    catch (error) {
      console.error('Error uploading file:', error)
      toast.error(`Не удалось загрузить "${file.name}"`)
    }
  }

  uploading.value = false
}

const deleteAttachment = async (attachment: Attachment) => {
  if (!confirm(`Удалить файл "${attachment.fileName}"?`)) return

  deleting.value = attachment.id

  try {
    await $fetch(`/api/admin/news/${props.newsId}/attachments/${attachment.id}`, {
      method: 'DELETE',
    })

    localAttachments.value = localAttachments.value.filter(a => a.id !== attachment.id)
    toast.success('Файл удалён')
  }
  catch (error) {
    console.error('Error deleting attachment:', error)
    toast.error('Не удалось удалить файл')
  }
  finally {
    deleting.value = null
  }
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-sm font-medium text-[var(--text-primary)]">
      Вложения
    </h3>

    <!-- Existing Attachments -->
    <div v-if="localAttachments.length > 0" class="space-y-2">
      <div
        v-for="att in localAttachments"
        :key="att.id"
        class="flex items-center gap-3 p-3 rounded-lg border transition-colors"
        style="background: var(--glass-bg); border-color: var(--glass-border);"
      >
        <Icon :name="getFileIcon(att.mimeType)" class="w-5 h-5 text-primary flex-shrink-0" />
        <span class="flex-1 text-sm text-[var(--text-secondary)] truncate">
          {{ att.fileName }}
        </span>
        <a
          :href="att.filePath"
          target="_blank"
          class="p-1.5 rounded hover:bg-primary/10 text-[var(--text-muted)] hover:text-primary transition-colors"
          title="Открыть"
        >
          <Icon name="heroicons:arrow-top-right-on-square" class="w-4 h-4" />
        </a>
        <button
          :disabled="deleting === att.id"
          class="p-1.5 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors disabled:opacity-50"
          title="Удалить"
          @click="deleteAttachment(att)"
        >
          <Icon
            :name="deleting === att.id ? 'heroicons:arrow-path' : 'heroicons:trash'"
            :class="['w-4 h-4', { 'animate-spin': deleting === att.id }]"
          />
        </button>
      </div>
    </div>

    <!-- Upload Zone -->
    <div
      :class="[
        'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
        dragOver
          ? 'border-primary bg-primary/10'
          : 'border-[var(--glass-border)] hover:border-primary/50 hover:bg-[var(--glass-bg)]',
      ]"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="handleDrop"
      @click="fileInput?.click()"
    >
      <Icon
        :name="uploading ? 'heroicons:arrow-path' : 'heroicons:cloud-arrow-up'"
        :class="['w-8 h-8 mx-auto mb-2 text-[var(--text-muted)]', { 'animate-spin': uploading }]"
      />
      <p class="text-sm text-[var(--text-secondary)]">
        {{ uploading ? 'Загрузка...' : 'Перетащите файлы или нажмите для выбора' }}
      </p>
      <p class="text-xs text-[var(--text-muted)] mt-1">
        До 10 МБ на файл
      </p>
    </div>

    <input
      ref="fileInput"
      type="file"
      class="hidden"
      multiple
      @change="handleFileSelect"
    />
  </div>
</template>
