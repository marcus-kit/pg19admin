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
          v-model="form.isPinned"
          type="checkbox"
          id="isPinned"
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

      <!-- Attachments -->
      <NewsAttachments
        :news-id="newsId"
        :attachments="attachments"
        @update="attachments = $event"
      />

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
