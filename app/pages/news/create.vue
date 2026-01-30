<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Создать новость — Админ-панель' })

const router = useRouter()
const toast = useToast()

const form = reactive({
  title: '',
  summary: '',
  content: '',
  category: 'announcement' as 'announcement' | 'protocol' | 'notification',
  status: 'draft' as 'draft' | 'published' | 'archived',
  isPinned: false,
})

const saving = ref(false)
const error = ref('')

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

async function saveNews() {
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
    const response = await $fetch<{ news: { id: string } }>('/api/admin/news', {
      method: 'POST',
      body: {
        title: form.title,
        summary: form.summary || null,
        content: form.content,
        category: form.category,
        status: form.status,
        isPinned: form.isPinned,
      },
    })

    toast.success('Новость успешно создана')
    router.push(`/news/${response.news.id}/edit`)
  }
  catch (err: unknown) {
    toast.error('Не удалось создать новость')
    error.value = err instanceof Error ? err.message : 'Ошибка при создании новости'
  }
  finally {
    saving.value = false
  }
}

function cancel() {
  router.push('/news')
}
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
            <Icon name="heroicons:newspaper" class="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 class="news-form-page__hero-title">
              Создать новость
            </h1>
            <p class="news-form-page__hero-subtitle">
              Заполните заголовок и контент новости
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- Ошибка -->
    <div v-if="error" class="news-form-page__error" role="alert">
      {{ error }}
    </div>

    <!-- Форма в glass-карточке -->
    <div class="news-form-page__main glass-card glass-card-static">
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

        <div class="news-form-page__hint">
          <Icon name="heroicons:paper-clip" class="news-form-page__hint-icon" />
          <p>Вложения можно добавить после сохранения новости</p>
        </div>

        <div class="news-form-page__actions">
          <UiButton
            :loading="saving"
            :disabled="saving"
            type="submit"
          >
            Сохранить
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
