<script setup lang="ts">
import type { NewsAttachment, NewsCategory, NewsStatus } from '~/types/admin'
import { getErrorMessage } from '~/composables/useFormatters'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Редактировать новость — Админ-панель' })

const router = useRouter()
const route = useRoute()
const toast = useToast()

const newsId = computed(() => route.params.id as string)

// Интерфейс для ответа API
interface NewsDetailResponse {
  id: string
  title: string
  summary: string | null
  content: string
  category: NewsCategory
  status: NewsStatus
  isPinned: boolean
  attachments: NewsAttachment[]
}

const form = reactive({
  title: '',
  summary: '',
  content: '',
  category: 'announcement' as NewsCategory,
  status: 'draft' as NewsStatus,
  isPinned: false,
})

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const attachments = ref<NewsAttachment[]>([])

// Attachments state
const uploading = ref(false)
const deleting = ref<string | null>(null)
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const categoryOptions = [
  { label: 'Объявление', value: 'announcement' },
  { label: 'Протокол', value: 'protocol' },
  { label: 'Уведомление', value: 'notification' },
]

const statusOptions = [
  { label: 'Черновик', value: 'draft' },
  { label: 'Опубликовать', value: 'published' },
  { label: 'Архив', value: 'archived' },
]

const getFileIcon = (mimeType?: string) => {
  if (!mimeType) return 'heroicons:document'
  if (mimeType.startsWith('image/')) return 'heroicons:photo'
  if (mimeType.includes('pdf')) return 'heroicons:document-text'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'heroicons:document-text'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'heroicons:table-cells'
  return 'heroicons:document'
}

// Загрузка данных новости
const fetchNews = async () => {
  loading.value = true
  error.value = ''

  try {
    const data = await $fetch<{ news: NewsDetailResponse }>(`/api/admin/news/${newsId.value}`)
    const news = data.news

    // Заполняем форму
    form.title = news.title
    form.summary = news.summary || ''
    form.content = news.content
    form.category = news.category
    form.status = news.status
    form.isPinned = news.isPinned

    // Сохраняем вложения
    attachments.value = news.attachments || []
  }
  catch (err: unknown) {
    toast.error('Не удалось загрузить новость')
    error.value = getErrorMessage(err) || 'Ошибка при загрузке новости'
  }
  finally {
    loading.value = false
  }
}

const saveNews = async () => {
  // Валидация
  if (!form.title.trim()) {
    error.value = 'Введите заголовок'
    return
  }

  if (!form.content.trim() || form.content === '<p></p>') {
    error.value = 'Введите контент новости'
    return
  }

  saving.value = true
  error.value = ''

  try {
    await $fetch(`/api/admin/news/${newsId.value}`, {
      method: 'PUT',
      body: {
        title: form.title,
        summary: form.summary || null,
        content: form.content,
        category: form.category,
        status: form.status,
        isPinned: form.isPinned,
      },
    })

    // Успех — переход к списку
    toast.success('Новость успешно сохранена')
    router.push('/news')
  }
  catch (err: unknown) {
    toast.error('Не удалось сохранить новость')
    error.value = getErrorMessage(err) || 'Ошибка при обновлении новости'
  }
  finally {
    saving.value = false
  }
}

const cancel = () => {
  router.push('/news')
}

// Attachments methods
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
    target.value = ''
  }
}

const uploadFiles = async (files: File[]) => {
  uploading.value = true

  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`Файл "${file.name}" превышает 10 МБ`)
      continue
    }

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await $fetch<{ success: boolean, attachment: NewsAttachment }>(
        `/api/admin/news/${newsId.value}/attachments`,
        {
          method: 'POST',
          body: formData,
        },
      )

      if (response.success && response.attachment) {
        attachments.value = [...attachments.value, response.attachment]
        toast.success(`Файл "${file.name}" загружен`)
      }
    }
    catch {
      toast.error(`Не удалось загрузить "${file.name}"`)
    }
  }

  uploading.value = false
}

const deleteAttachment = async (attachment: NewsAttachment) => {
  if (!confirm(`Удалить файл "${attachment.fileName}"?`)) return

  deleting.value = attachment.id

  try {
    await $fetch(`/api/admin/news/${newsId.value}/attachments/${attachment.id}`, {
      method: 'DELETE',
    })

    attachments.value = attachments.value.filter(a => a.id !== attachment.id)
    toast.success('Файл удалён')
  }
  catch {
    toast.error('Не удалось удалить файл')
  }
  finally {
    deleting.value = null
  }
}

// Загружаем данные при монтировании
onMounted(() => {
  fetchNews()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-[var(--text-primary)]">
        Редактировать новость
      </h1>
    </div>

    <!-- Loading -->
    <UiLoading v-if="loading" />

    <!-- Error -->
    <div v-else-if="error && !loading" class="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
      {{ error }}
    </div>

    <!-- Form -->
    <form v-else class="space-y-6" @submit.prevent="saveNews">
      <!-- Title -->
      <div>
        <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Заголовок *
        </label>
        <UiInput
          v-model="form.title"
          placeholder="Введите заголовок новости"
          size="lg"
        />
      </div>

      <!-- Summary -->
      <div>
        <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Краткое описание
        </label>
        <UiInput
          v-model="form.summary"
          placeholder="Краткое описание (опционально)"
        />
      </div>

      <!-- Category & Status -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UiSelect
          v-model="form.category"
          :options="categoryOptions"
          :placeholder="undefined"
          label="Категория"
        />

        <UiSelect
          v-model="form.status"
          :options="statusOptions"
          :placeholder="undefined"
          label="Статус"
        />
      </div>

      <!-- Pin -->
      <div class="flex items-center gap-3">
        <input
          id="isPinned"
          v-model="form.isPinned"
          type="checkbox"
          class="w-5 h-5 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary"
        />
        <label for="isPinned" class="text-sm text-[var(--text-secondary)] cursor-pointer">
          Закрепить новость
        </label>
      </div>

      <!-- Content Editor -->
      <div>
        <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Контент *
        </label>
        <NewsEditor v-model="form.content" />
      </div>

      <!-- Attachments (бывший NewsAttachments) -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-[var(--text-primary)]">
          Вложения
        </h3>

        <!-- Existing Attachments -->
        <div v-if="attachments.length > 0" class="space-y-2">
          <div
            v-for="att in attachments"
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
              type="button"
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

      <!-- Actions -->
      <div class="flex gap-3">
        <UiButton
          :loading="saving"
          :disabled="saving"
          type="submit"
        >
          Сохранить изменения
        </UiButton>
        <UiButton
          :disabled="saving"
          variant="ghost"
          @click="cancel"
        >
          Отмена
        </UiButton>
      </div>
    </form>
  </div>
</template>
