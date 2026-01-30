<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Создать категорию — Админ-панель' })

const toast = useToast()
const router = useRouter()

// Данные формы
const form = reactive({
  name: '',
  slug: '',
  description: '',
  icon: 'heroicons:folder',
  sortOrder: 0,
  isActive: true,
})

// Состояние сохранения
const saving = ref(false)
const error = ref('')

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

// Генерирует slug из названия (транслитерация кириллицы)
function generateSlug() {
  if (!form.slug && form.name) {
    form.slug = form.name
      .toLowerCase()
      .replace(/[а-яё]/g, (char) => {
        const map: Record<string, string> = {
          а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo',
          ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
          н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
          ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '',
          ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
        }
        return map[char] || char
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

// Сохранение категории
async function save() {
  if (!form.name.trim()) {
    error.value = 'Введите название категории'
    return
  }

  if (!form.slug.trim()) {
    error.value = 'Введите URL категории'
    return
  }

  saving.value = true
  error.value = ''

  try {
    await $fetch('/api/admin/catalog/categories', {
      method: 'POST',
      body: {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        icon: form.icon || null,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      },
    })

    toast.success('Категория создана')
    router.push('/catalog')
  }
  catch {
    error.value = 'Ошибка при создании категории'
    toast.error('Не удалось создать категорию')
  }
  finally {
    saving.value = false
  }
}

function cancel() {
  router.push('/catalog')
}
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
            <Icon name="heroicons:folder-plus" class="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 class="catalog-form-page__hero-title">Создать категорию</h1>
            <p class="catalog-form-page__hero-subtitle">Добавление новой категории в каталог</p>
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
            <UiInput v-model="form.name" label="Название *" placeholder="Например: Интернет" size="lg" @blur="generateSlug" />
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
          <UiButton :loading="saving" :disabled="saving" type="submit">Сохранить</UiButton>
          <UiButton :disabled="saving" variant="secondary" @click="cancel">Отмена</UiButton>
        </div>
      </form>
    </div>
  </div>
</template>
