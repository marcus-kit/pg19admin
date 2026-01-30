<script setup lang="ts">
// Интерфейс ответа API для категории
interface CategoryResponse {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sortOrder: number
  isActive: boolean
}

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Редактировать категорию — Админ-панель' })

const toast = useToast()
const router = useRouter()
const route = useRoute()

const form = reactive({
  name: '',
  slug: '',
  description: '',
  icon: 'heroicons:folder',
  sortOrder: 0,
  isActive: true,
})

const loading = ref(true)
const saving = ref(false)
const error = ref('')

const categoryId = computed(() => route.params.id as string)

// Доступные иконки для категорий
const iconOptions = [
  { label: 'Папка', value: 'heroicons:folder' },
  { label: 'Wi-Fi', value: 'heroicons:wifi' },
  { label: 'ТВ', value: 'heroicons:tv' },
  { label: 'Плюс', value: 'heroicons:plus-circle' },
  { label: 'Звезда', value: 'heroicons:star' },
  { label: 'Молния', value: 'heroicons:bolt' },
  { label: 'Глобус', value: 'heroicons:globe-alt' },
  { label: 'Телефон', value: 'heroicons:phone' },
]

// Загрузка данных категории
async function fetchCategory() {
  loading.value = true
  try {
    const data = await $fetch<{ category: CategoryResponse }>(`/api/admin/catalog/categories/${categoryId.value}`)
    const cat = data.category
    form.name = cat.name
    form.slug = cat.slug
    form.description = cat.description || ''
    form.icon = cat.icon || 'heroicons:folder'
    form.sortOrder = cat.sortOrder
    form.isActive = cat.isActive
  }
  catch {
    error.value = 'Ошибка при загрузке категории'
    toast.error('Не удалось загрузить категорию')
  }
  finally {
    loading.value = false
  }
}

// Сохранение изменений категории
async function save() {
  if (!form.name.trim()) {
    error.value = 'Введите название категории'
    return
  }

  saving.value = true
  error.value = ''

  try {
    await $fetch(`/api/admin/catalog/categories/${categoryId.value}`, {
      method: 'PUT',
      body: {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        icon: form.icon || null,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      },
    })

    toast.success('Категория сохранена')
    router.push('/catalog')
  }
  catch {
    error.value = 'Ошибка при обновлении категории'
    toast.error('Не удалось сохранить категорию')
  }
  finally {
    saving.value = false
  }
}

function cancel() {
  router.push('/catalog')
}

onMounted(() => {
  fetchCategory()
})
</script>

<template>
  <div class="catalog-form-page">
    <header class="catalog-form-page__hero">
      <div class="catalog-form-page__hero-bg" aria-hidden="true" />
      <div class="catalog-form-page__hero-inner">
        <button type="button" class="catalog-form-page__back" aria-label="Назад" @click="cancel">
          <Icon name="heroicons:arrow-left" class="w-5 h-5" />
        </button>
        <div class="flex items-center gap-3">
          <div class="catalog-form-page__hero-icon">
            <Icon name="heroicons:pencil-square" class="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 class="catalog-form-page__hero-title">Редактировать категорию</h1>
            <p class="catalog-form-page__hero-subtitle">Изменение данных категории</p>
          </div>
        </div>
      </div>
    </header>

    <UiLoading v-if="loading" class="catalog-form-page__loading" />
    <div v-else-if="error && !form.name" class="catalog-form-page__error" role="alert">{{ error }}</div>

    <div v-else class="catalog-form-page__main glass-card glass-card-static">
      <form @submit.prevent="save" class="catalog-form-page__form">
        <div v-if="error" class="catalog-form-page__error" role="alert">{{ error }}</div>

        <section class="catalog-form-page__section">
          <h2 class="catalog-form-page__section-title">Основные данные</h2>
          <div class="catalog-form-page__fields space-y-4">
            <UiInput v-model="form.name" label="Название *" placeholder="Например: Интернет" size="lg" />
            <div>
              <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">URL (slug) *</label>
              <div class="flex items-center gap-2">
                <span class="text-[var(--text-muted)]">/</span>
                <UiInput v-model="form.slug" placeholder="internet" class="flex-1 font-mono" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">Описание</label>
              <textarea v-model="form.description" placeholder="Описание категории" rows="3" class="w-full px-4 py-3 rounded-lg text-[var(--text-primary)] border border-[var(--glass-border)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-[var(--glass-bg)] resize-none" />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">Иконка</label>
                <div class="flex items-center gap-3">
                  <div class="flex-1">
                    <UiSelect v-model="form.icon" :options="iconOptions" :placeholder="undefined" />
                  </div>
                  <div class="w-12 h-12 flex items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]">
                    <Icon :name="form.icon" class="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>
              <UiInput v-model.number="form.sortOrder" label="Порядок сортировки" type="number" placeholder="0" />
            </div>
            <div class="flex items-center gap-3">
              <input v-model="form.isActive" type="checkbox" id="isActive" class="w-5 h-5 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary" />
              <label for="isActive" class="text-sm text-[var(--text-secondary)] cursor-pointer">Активна</label>
            </div>
          </div>
        </section>

        <div class="catalog-form-page__actions">
          <UiButton :loading="saving" :disabled="saving" type="submit">Сохранить изменения</UiButton>
          <UiButton :disabled="saving" variant="secondary" @click="cancel">Отмена</UiButton>
        </div>
      </form>
    </div>
  </div>
</template>
