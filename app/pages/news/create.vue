<script setup lang="ts">
import { useAdminAuthStore } from '~/stores/adminAuth'

const toast = useToast()

definePageMeta({
  middleware: 'admin'
})

useHead({ title: 'Создать новость — Админ-панель' })

const adminAuthStore = useAdminAuthStore()
const router = useRouter()

const form = reactive({
  title: '',
  summary: '',
  content: '',
  category: 'announcement' as 'announcement' | 'protocol' | 'notification',
  status: 'draft' as 'draft' | 'published' | 'archived',
  isPinned: false
})

const saving = ref(false)
const error = ref('')

const categoryOptions = [
  { label: 'Объявление', value: 'announcement' },
  { label: 'Протокол', value: 'protocol' },
  { label: 'Уведомление', value: 'notification' }
]

const statusOptions = [
  { label: 'Черновик', value: 'draft' },
  { label: 'Опубликовать', value: 'published' },
  { label: 'Архив', value: 'archived' }
]

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

  if (!adminAuthStore.isAuthenticated) {
    error.value = 'Требуется авторизация'
    return
  }

  saving.value = true
  error.value = ''

  try {
    const response = await $fetch<{ news: { id: string } }>('/api/admin/news', {
      method: 'POST',
      body: {
        title: form.title,
        summary: form.summary || null,
        content: form.content,
        category: form.category,
        status: form.status,
        isPinned: form.isPinned
      }
    })

    // Успех — переход к редактированию для добавления вложений
    toast.success('Новость успешно создана')
    router.push(`/news/${response.news.id}/edit`)
  } catch (err: any) {
    console.error('Failed to create news:', err)
    toast.error('Не удалось создать новость')
    error.value = err.data?.message || 'Ошибка при создании новости'
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  router.push('/news')
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-[var(--text-primary)]">
        Создать новость
      </h1>
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
      {{ error }}
    </div>

    <!-- Form -->
    <form @submit.prevent="saveNews" class="space-y-6">
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
          label="Категория"
          :placeholder="undefined"
        />

        <UiSelect
          v-model="form.status"
          :options="statusOptions"
          label="Статус"
          :placeholder="undefined"
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
        <AdminNewsEditor v-model="form.content" />
      </div>

      <!-- Attachments hint -->
      <div class="p-4 rounded-lg border border-dashed" style="border-color: var(--glass-border); background: var(--glass-bg);">
        <div class="flex items-center gap-3 text-[var(--text-muted)]">
          <Icon name="heroicons:paper-clip" class="w-5 h-5" />
          <p class="text-sm">
            Вложения можно добавить после сохранения новости
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <UiButton
          type="submit"
          :loading="saving"
          :disabled="saving"
        >
          Сохранить
        </UiButton>
        <UiButton
          variant="ghost"
          @click="cancel"
          :disabled="saving"
        >
          Отмена
        </UiButton>
      </div>
    </form>
  </div>
</template>

