<script setup lang="ts">
import type { NewsAttachment, NewsCategory, NewsStatus } from '~/types/admin'
import { getErrorMessage } from '~/composables/useFormatters'

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

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Редактировать новость — Админ-панель' })

const router = useRouter()
const route = useRoute()
const toast = useToast()

// Данные формы
const form = reactive({
  title: '',
  summary: '',
  content: '',
  category: 'announcement' as NewsCategory,
  status: 'draft' as NewsStatus,
  isPinned: false,
})

// Состояние загрузки и ошибок
const loading = ref(true) // Загрузка данных
const saving = ref(false) // Сохранение формы
const error = ref('') // Текст ошибки
const attachments = ref<NewsAttachment[]>([]) // Список вложений

// Состояние для работы с вложениями
const uploading = ref(false) // Загрузка файла
const deleting = ref<string | null>(null) // ID удаляемого файла
const dragOver = ref(false) // Drag-n-drop активен
const fileInput = ref<HTMLInputElement | null>(null) // Ссылка на input файла

const newsId = computed(() => route.params.id as string)

// Опции выбора категории
const categoryOptions = [
  { label: 'Объявление', value: 'announcement' },
  { label: 'Протокол', value: 'protocol' },
  { label: 'Уведомление', value: 'notification' },
]

// Опции выбора статуса
const statusOptions = [
  { label: 'Черновик', value: 'draft' },
  { label: 'Опубликовать', value: 'published' },
  { label: 'Архив', value: 'archived' },
]

// Возвращает иконку в зависимости от типа файла
function getFileIcon(mimeType?: string) {
  if (!mimeType) return 'heroicons:document'
  if (mimeType.startsWith('image/')) return 'heroicons:photo'
  if (mimeType.includes('pdf')) return 'heroicons:document-text'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'heroicons:document-text'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'heroicons:table-cells'
  return 'heroicons:document'
}

// Загрузка данных новости с сервера
async function fetchNews() {
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

// Сохранение изменений новости
async function saveNews() {
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

// Отмена и возврат к списку
function cancel() {
  router.push('/news')
}

// Обработка drop события для загрузки файлов
async function handleDrop(e: DragEvent) {
  dragOver.value = false
  const files = e.dataTransfer?.files
  if (files?.length) {
    await uploadFiles(Array.from(files))
  }
}

// Обработка выбора файлов через input
async function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    await uploadFiles(Array.from(target.files))
    target.value = ''
  }
}

// Загрузка файлов на сервер
async function uploadFiles(files: File[]) {
  uploading.value = true

  for (const file of files) {
    // Проверка размера файла (макс 10 МБ)
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

// Удаление вложения
async function deleteAttachment(attachment: NewsAttachment) {
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
  <div class="news-form-page">
    <!-- Hero: градиент + кнопка назад + заголовок -->
    <header class="news-form-page__hero">
      <div class="news-form-page__hero-bg" aria-hidden="true" />
      <div class="news-form-page__hero-inner">
        <button
          type="button"
          class="news-form-page__back"
          aria-label="Назад к списку"
          @click="cancel"
        >
          <Icon name="heroicons:arrow-left" class="w-5 h-5" />
        </button>
        <div class="flex items-center gap-3">
          <div class="news-form-page__hero-icon">
            <Icon name="heroicons:pencil-square" class="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 class="news-form-page__hero-title">
              Редактировать новость
            </h1>
            <p class="news-form-page__hero-subtitle">
              Изменение заголовка, контента и вложений
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <UiLoading v-if="loading" class="news-form-page__loading" />

    <!-- Ошибка -->
    <div v-else-if="error" class="news-form-page__error" role="alert">
      {{ error }}
    </div>

    <!-- Форма в glass-карточке -->
    <div v-else class="news-form-page__main glass-card glass-card-static">
      <form @submit.prevent="saveNews" class="news-form-page__form">
        <section class="news-form-page__section">
          <h2 class="news-form-page__section-title">
            Основные данные
          </h2>
          <div class="news-form-page__fields space-y-4">
            <UiInput
              v-model="form.title"
              label="Заголовок *"
              placeholder="Введите заголовок новости"
              size="lg"
            />
            <UiInput
              v-model="form.summary"
              label="Краткое описание"
              placeholder="Краткое описание (опционально)"
            />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div class="flex items-center gap-3">
              <input
                v-model="form.isPinned"
                id="isPinned"
                type="checkbox"
                class="w-5 h-5 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary"
              />
              <label for="isPinned" class="text-sm text-[var(--text-secondary)] cursor-pointer">
                Закрепить новость
              </label>
            </div>
          </div>
        </section>

        <section class="news-form-page__section">
          <h2 class="news-form-page__section-title">
            Контент *
          </h2>
          <div class="news-form-page__fields">
            <NewsEditor v-model="form.content" />
          </div>
        </section>

        <section class="news-form-page__section">
          <h2 class="news-form-page__section-title">
            Вложения
          </h2>
          <div class="news-form-page__fields space-y-4">
            <!-- Список вложений -->
            <div v-if="attachments.length > 0" class="space-y-2">
              <div
                v-for="att in attachments"
                :key="att.id"
                class="news-form-page__attachment"
              >
                <Icon :name="getFileIcon(att.mimeType)" class="w-5 h-5 text-primary flex-shrink-0" />
                <span class="flex-1 text-sm text-[var(--text-secondary)] truncate">
                  {{ att.fileName }}
                </span>
                <a
                  :href="att.filePath"
                  target="_blank"
                  class="news-form-page__attachment-link"
                  title="Открыть"
                >
                  <Icon name="heroicons:arrow-top-right-on-square" class="w-4 h-4" />
                </a>
                <button
                  :disabled="deleting === att.id"
                  type="button"
                  class="news-form-page__attachment-delete"
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

            <!-- Зона загрузки -->
            <div
              :class="[
                'news-form-page__upload',
                dragOver && 'news-form-page__upload--active',
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
        </section>

        <div class="news-form-page__actions">
          <UiButton
            :loading="saving"
            :disabled="saving"
            type="submit"
          >
            Сохранить изменения
          </UiButton>
          <UiButton
            :disabled="saving"
            variant="secondary"
            @click="cancel"
          >
            Отмена
          </UiButton>
        </div>
      </form>
    </div>
  </div>
</template>
