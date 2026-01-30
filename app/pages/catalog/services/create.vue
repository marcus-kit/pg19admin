<script setup lang="ts">
import type { CategoryOption } from '~/types/admin'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Создать услугу — Админ-панель' })

const toast = useToast()
const router = useRouter()

const form = reactive({
  name: '',
  description: '',
  fullDescription: '',
  priceMonthly: 0,
  priceConnection: 0,
  imageUrl: '',
  features: [] as string[],
  sortOrder: 0,
  isActive: true,
  categoryId: null as number | null,
})

// Состояние сохранения
const saving = ref(false)
const error = ref('')
const categories = ref<CategoryOption[]>([])
const newFeature = ref('')

// Цены в форме в рублях, конвертируем в копейки при сохранении
const priceMonthlyRub = ref(0)
const priceConnectionRub = ref(0)

// Опции категорий для select
const categoryOptions = computed(() => [
  { value: null, label: 'Без категории' },
  ...categories.value.map(cat => ({ value: cat.id, label: cat.name })),
])

// Загрузка списка категорий
async function fetchCategories() {
  try {
    const data = await $fetch<{ categories: CategoryOption[] }>('/api/admin/catalog/categories')
    categories.value = data.categories
  }
  catch {
    toast.error('Не удалось загрузить категории')
  }
}

// Добавление характеристики в список
function addFeature() {
  const feature = newFeature.value.trim()
  if (feature && !form.features.includes(feature)) {
    form.features.push(feature)
    newFeature.value = ''
  }
}

// Удаление характеристики из списка
function removeFeature(index: number) {
  form.features.splice(index, 1)
}

// Сохранение услуги
async function save() {
  if (!form.name.trim()) {
    error.value = 'Введите название услуги'
    return
  }

  if (priceMonthlyRub.value <= 0) {
    error.value = 'Укажите ежемесячную стоимость'
    return
  }

  saving.value = true
  error.value = ''

  try {
    await $fetch('/api/admin/catalog/services', {
      method: 'POST',
      body: {
        name: form.name,
        description: form.description || null,
        fullDescription: form.fullDescription || null,
        priceMonthly: Math.round(priceMonthlyRub.value * 100),
        priceConnection: priceConnectionRub.value > 0 ? Math.round(priceConnectionRub.value * 100) : null,
        imageUrl: form.imageUrl || null,
        features: form.features.length > 0 ? form.features : null,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        categoryId: form.categoryId,
      },
    })

    toast.success('Услуга успешно создана')
    router.push('/catalog')
  }
  catch {
    toast.error('Не удалось создать услугу')
    error.value = 'Ошибка при создании услуги'
  }
  finally {
    saving.value = false
  }
}

function cancel() {
  router.push('/catalog')
}

onMounted(() => {
  fetchCategories()
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
            <Icon name="heroicons:plus-circle" class="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 class="catalog-form-page__hero-title">Создать услугу</h1>
            <p class="catalog-form-page__hero-subtitle">Добавление новой услуги в каталог</p>
          </div>
        </div>
      </div>
    </header>

    <div v-if="error" class="catalog-form-page__error" role="alert">{{ error }}</div>

    <div class="catalog-form-page__main glass-card glass-card-static">
      <form @submit.prevent="save" class="catalog-form-page__form">
        <section class="catalog-form-page__section">
          <h2 class="catalog-form-page__section-title">Основные данные</h2>
          <div class="catalog-form-page__fields space-y-4">
            <UiInput v-model="form.name" label="Название *" placeholder="Например: Интернет 100 Мбит/с" size="lg" />
            <UiSelect v-model="form.categoryId" :options="categoryOptions" label="Категория" placeholder="Без категории" />
            <div>
              <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">Краткое описание</label>
              <textarea v-model="form.description" placeholder="Краткое описание для карточки услуги" rows="2" class="w-full px-4 py-3 rounded-lg text-[var(--text-primary)] border border-[var(--glass-border)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-[var(--glass-bg)] resize-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">Полное описание</label>
              <textarea v-model="form.fullDescription" placeholder="Подробное описание услуги для страницы детализации" rows="4" class="w-full px-4 py-3 rounded-lg text-[var(--text-primary)] border border-[var(--glass-border)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-[var(--glass-bg)] resize-none" />
            </div>
          </div>
        </section>

        <section class="catalog-form-page__section">
          <h2 class="catalog-form-page__section-title">Стоимость</h2>
          <div class="catalog-form-page__fields grid grid-cols-1 md:grid-cols-2 gap-4">
            <UiInput v-model.number="priceMonthlyRub" label="Ежемесячная стоимость (₽) *" type="number" min="0" step="0.01" placeholder="500" />
            <UiInput v-model.number="priceConnectionRub" label="Стоимость подключения (₽)" type="number" min="0" step="0.01" placeholder="0 — бесплатно" />
          </div>
        </section>

        <section class="catalog-form-page__section">
          <h2 class="catalog-form-page__section-title">Дополнительно</h2>
          <div class="catalog-form-page__fields space-y-4">
            <UiInput v-model="form.imageUrl" label="URL изображения" placeholder="https://..." />
            <div>
              <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">Характеристики</label>
              <div class="flex gap-2 mb-3">
                <UiInput v-model="newFeature" @keyup.enter.prevent="addFeature" placeholder="Добавить характеристику" class="flex-1" />
                <UiButton @click="addFeature" type="button" variant="secondary">
                  <Icon name="heroicons:plus" class="w-5 h-5" />
                </UiButton>
              </div>
              <div v-if="form.features.length > 0" class="flex flex-wrap gap-2">
                <span v-for="(feature, index) in form.features" :key="index" class="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                  {{ feature }}
                  <button @click="removeFeature(index)" type="button" class="hover:text-red-400 transition-colors">
                    <Icon name="heroicons:x-mark" class="w-4 h-4" />
                  </button>
                </span>
              </div>
            </div>
            <UiInput v-model.number="form.sortOrder" label="Порядок сортировки" type="number" placeholder="0" />
            <div class="flex items-center gap-3">
              <input v-model="form.isActive" type="checkbox" id="isActive" class="w-5 h-5 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary" />
              <label for="isActive" class="text-sm text-[var(--text-secondary)] cursor-pointer">Активна</label>
            </div>
          </div>
        </section>

        <div class="catalog-form-page__actions">
          <UiButton :loading="saving" :disabled="saving" type="submit">Сохранить</UiButton>
          <UiButton :disabled="saving" variant="secondary" @click="cancel">Отмена</UiButton>
        </div>
      </form>
    </div>
  </div>
</template>
