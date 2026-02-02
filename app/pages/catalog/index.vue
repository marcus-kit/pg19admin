<script setup lang="ts">
import type { ServiceCategory, Service } from '~/types/admin'
import { ACTIVE_STATUS, getStatusBadgeClass, getStatusLabel } from '~/composables/useStatusConfig'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Каталог услуг — Админ-панель' })

const toast = useToast()
const router = useRouter()

// Состояние страницы
const activeTab = ref<'categories' | 'services'>('services')
const loading = ref(false)
const categories = ref<ServiceCategory[]>([])
const services = ref<Service[]>([])
const selectedCategoryId = ref<string | null>(null)

// Состояние модальных окон
const showCategoryModal = ref(false)
const showServiceModal = ref(false)

// Данные формы категории
const categoryForm = reactive({
  name: '',
  slug: '',
  description: '',
  icon: 'heroicons:folder',
  sortOrder: 0,
  isActive: true,
})

// Данные формы услуги
const serviceForm = reactive({
  name: '',
  description: '',
  fullDescription: '',
  priceMonthlyRub: 0,
  priceConnectionRub: 0,
  imageUrl: '',
  features: [] as string[],
  sortOrder: 0,
  isActive: true,
  categoryId: null as number | null,
})

const newFeature = ref('')
const savingCategory = ref(false)
const savingService = ref(false)
const categoryError = ref('')
const serviceError = ref('')

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

// Опции категорий для select
const categoryOptions = computed(() => [
  { value: null, label: 'Без категории' },
  ...categories.value.map(cat => ({ value: cat.id, label: cat.name })),
])

// Конвертирует boolean isActive в ключ статуса для badge
function getActiveStatus(isActive: boolean) {
  return isActive ? 'active' : 'inactive'
}

// Загрузка списка категорий
async function fetchCategories() {
  try {
    const data = await $fetch<{ categories: ServiceCategory[] }>('/api/admin/catalog/categories')
    categories.value = data.categories
  }
  catch {
    toast.error('Не удалось загрузить категории')
  }
}

// Загрузка списка услуг с фильтром по категории
async function fetchServices() {
  loading.value = true
  try {
    const query = new URLSearchParams()
    if (selectedCategoryId.value) {
      query.set('categoryId', selectedCategoryId.value)
    }
    const data = await $fetch<{ services: Service[] }>(`/api/admin/catalog/services?${query}`)
    services.value = data.services
  }
  catch {
    toast.error('Не удалось загрузить услуги')
  }
  finally {
    loading.value = false
  }
}

// Генерирует slug из названия
function generateSlug() {
  if (!categoryForm.slug && categoryForm.name) {
    categoryForm.slug = categoryForm.name
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

// Открыть модальное окно создания категории
function openCategoryModal() {
  categoryForm.name = ''
  categoryForm.slug = ''
  categoryForm.description = ''
  categoryForm.icon = 'heroicons:folder'
  categoryForm.sortOrder = 0
  categoryForm.isActive = true
  categoryError.value = ''
  showCategoryModal.value = true
}

// Закрыть модальное окно создания категории
function closeCategoryModal() {
  showCategoryModal.value = false
}

// Создание категории
async function createCategory() {
  if (!categoryForm.name.trim()) {
    categoryError.value = 'Введите название категории'
    return
  }

  if (!categoryForm.slug.trim()) {
    categoryError.value = 'Введите URL категории'
    return
  }

  savingCategory.value = true
  categoryError.value = ''

  try {
    await $fetch('/api/admin/catalog/categories', {
      method: 'POST',
      body: {
        name: categoryForm.name,
        slug: categoryForm.slug,
        description: categoryForm.description || null,
        icon: categoryForm.icon || null,
        sortOrder: categoryForm.sortOrder,
        isActive: categoryForm.isActive,
      },
    })

    toast.success('Категория создана')
    closeCategoryModal()
    await fetchCategories()
  }
  catch {
    categoryError.value = 'Ошибка при создании категории'
    toast.error('Не удалось создать категорию')
  }
  finally {
    savingCategory.value = false
  }
}

// Открыть модальное окно создания услуги
function openServiceModal() {
  serviceForm.name = ''
  serviceForm.description = ''
  serviceForm.fullDescription = ''
  serviceForm.priceMonthlyRub = 0
  serviceForm.priceConnectionRub = 0
  serviceForm.imageUrl = ''
  serviceForm.features = []
  serviceForm.sortOrder = 0
  serviceForm.isActive = true
  serviceForm.categoryId = null
  newFeature.value = ''
  serviceError.value = ''
  showServiceModal.value = true
}

// Закрыть модальное окно создания услуги
function closeServiceModal() {
  showServiceModal.value = false
}

// Добавление характеристики в список
function addFeature() {
  const feature = newFeature.value.trim()
  if (feature && !serviceForm.features.includes(feature)) {
    serviceForm.features.push(feature)
    newFeature.value = ''
  }
}

// Удаление характеристики из списка
function removeFeature(index: number) {
  serviceForm.features.splice(index, 1)
}

// Создание услуги
async function createService() {
  if (!serviceForm.name.trim()) {
    serviceError.value = 'Введите название услуги'
    return
  }

  if (serviceForm.priceMonthlyRub <= 0) {
    serviceError.value = 'Укажите ежемесячную стоимость'
    return
  }

  savingService.value = true
  serviceError.value = ''

  try {
    await $fetch('/api/admin/catalog/services', {
      method: 'POST',
      body: {
        name: serviceForm.name,
        description: serviceForm.description || null,
        fullDescription: serviceForm.fullDescription || null,
        priceMonthly: Math.round(serviceForm.priceMonthlyRub * 100),
        priceConnection: serviceForm.priceConnectionRub > 0 ? Math.round(serviceForm.priceConnectionRub * 100) : null,
        imageUrl: serviceForm.imageUrl || null,
        features: serviceForm.features.length > 0 ? serviceForm.features : null,
        sortOrder: serviceForm.sortOrder,
        isActive: serviceForm.isActive,
        categoryId: serviceForm.categoryId,
      },
    })

    toast.success('Услуга успешно создана')
    closeServiceModal()
    await fetchServices()
  }
  catch {
    serviceError.value = 'Ошибка при создании услуги'
    toast.error('Не удалось создать услугу')
  }
  finally {
    savingService.value = false
  }
}

// Удаление категории с подтверждением
async function deleteCategory(id: string) {
  if (!confirm('Удалить эту категорию?')) return

  try {
    await $fetch(`/api/admin/catalog/categories/${id}`, { method: 'DELETE' })
    toast.success('Категория успешно удалена')
    await fetchCategories()
  }
  catch {
    toast.error('Не удалось удалить категорию')
  }
}

// Удаление услуги с подтверждением
async function deleteService(id: string) {
  if (!confirm('Удалить эту услугу?')) return

  try {
    await $fetch(`/api/admin/catalog/services/${id}`, { method: 'DELETE' })
    toast.success('Услуга успешно удалена')
    await fetchServices()
  }
  catch {
    toast.error('Не удалось удалить услугу')
  }
}

onMounted(async () => {
  await fetchCategories()
  await fetchServices()
})

watch(selectedCategoryId, () => {
  fetchServices()
})

// Управление overflow body при открытии модальных окон
watch(showCategoryModal, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  }
  else {
    document.body.style.overflow = ''
  }
})

watch(showServiceModal, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  }
  else {
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <h1 class="flex items-center gap-3 text-3xl font-bold text-[var(--text-primary)]">
        <Icon name="heroicons:squares-2x2" class="h-8 w-8 text-[#F7941D]" />
        Каталог услуг
      </h1>
      <div class="flex gap-2">
        <UiButton @click="openCategoryModal" variant="secondary">
          <Icon name="heroicons:folder-plus" class="w-5 h-5" />
          Категория
        </UiButton>
        <UiButton @click="openServiceModal">
          <Icon name="heroicons:plus" class="w-5 h-5" />
          Услуга
        </UiButton>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6 border-b border-[var(--glass-border)]">
      <button
        :class="activeTab === 'services'
          ? 'border-primary text-primary'
          : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'"
        @click="activeTab = 'services'"
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
      >
        Услуги ({{ services.length }})
      </button>
      <button
        :class="activeTab === 'categories'
          ? 'border-primary text-primary'
          : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'"
        @click="activeTab = 'categories'"
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
      >
        Категории ({{ categories.length }})
      </button>
    </div>

    <!-- Services Tab -->
    <div v-if="activeTab === 'services'">
      <!-- Category Filter -->
      <div class="flex flex-wrap gap-2 mb-6">
        <UiButton
          :class="{ 'bg-primary/20': selectedCategoryId === null }"
          @click="selectedCategoryId = null"
          variant="ghost"
          size="sm"
        >
          Все
        </UiButton>
        <UiButton
          v-for="cat in categories"
          :key="cat.id"
          :class="{ 'bg-primary/20': selectedCategoryId === cat.id }"
          @click="selectedCategoryId = cat.id"
          variant="ghost"
          size="sm"
        >
          {{ cat.name }}
        </UiButton>
      </div>

      <!-- Services List -->
      <div v-if="loading" class="text-center py-12">
        <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary mx-auto" />
      </div>

      <div v-else class="space-y-4">
        <UiCard
          v-for="item in services"
          :key="item.id"
          class="hover:shadow-lg transition-shadow"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <UiBadge :class="getStatusBadgeClass(ACTIVE_STATUS, getActiveStatus(item.isActive))">
                  {{ getStatusLabel(ACTIVE_STATUS, getActiveStatus(item.isActive)) }}
                </UiBadge>
                <UiBadge v-if="item.category" class="bg-secondary/20 text-secondary">
                  {{ item.category.name }}
                </UiBadge>
              </div>

              <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-1">
                {{ item.name }}
              </h3>

              <p v-if="item.description" class="text-sm text-[var(--text-muted)] mb-2">
                {{ item.description }}
              </p>

              <div class="flex gap-4 text-sm">
                <span class="text-primary font-medium">
                  {{ formatPrice(item.priceMonthly) }}/мес
                </span>
                <span v-if="item.priceConnection" class="text-[var(--text-muted)]">
                  Подключение: {{ formatPrice(item.priceConnection) }}
                </span>
              </div>
            </div>

            <div class="flex gap-2">
              <UiButton
                @click="router.push(`/catalog/services/${item.id}/edit`)"
                variant="ghost"
                size="sm"
                title="Редактировать"
              >
                <Icon name="heroicons:pencil" class="w-4 h-4" />
              </UiButton>
              <UiButton
                @click="deleteService(item.id)"
                variant="ghost"
                size="sm"
                title="Удалить"
              >
                <Icon name="heroicons:trash" class="w-4 h-4 text-red-400" />
              </UiButton>
            </div>
          </div>
        </UiCard>

        <div v-if="services.length === 0" class="text-center py-12">
          <Icon name="heroicons:squares-2x2" class="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <p class="text-[var(--text-muted)]">Услуг пока нет</p>
        </div>
      </div>
    </div>

    <!-- Categories Tab -->
    <div v-if="activeTab === 'categories'" class="space-y-4">
      <UiCard
        v-for="item in categories"
        :key="item.id"
        class="hover:shadow-lg transition-shadow"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <UiBadge :class="getStatusBadgeClass(ACTIVE_STATUS, getActiveStatus(item.isActive))">
                {{ getStatusLabel(ACTIVE_STATUS, getActiveStatus(item.isActive)) }}
              </UiBadge>
              <span class="text-xs text-[var(--text-muted)] font-mono bg-[var(--glass-bg)] px-2 py-0.5 rounded">
                /{{ item.slug }}
              </span>
            </div>

            <div class="flex items-center gap-2 mb-1">
              <Icon v-if="item.icon" :name="item.icon" class="w-5 h-5 text-primary" />
              <h3 class="text-lg font-semibold text-[var(--text-primary)]">
                {{ item.name }}
              </h3>
            </div>

            <p v-if="item.description" class="text-sm text-[var(--text-muted)]">
              {{ item.description }}
            </p>
          </div>

          <div class="flex gap-2">
            <UiButton
              @click="router.push(`/catalog/categories/${item.id}/edit`)"
              variant="ghost"
              size="sm"
              title="Редактировать"
            >
              <Icon name="heroicons:pencil" class="w-4 h-4" />
            </UiButton>
            <UiButton
              @click="deleteCategory(item.id)"
              variant="ghost"
              size="sm"
              title="Удалить"
            >
              <Icon name="heroicons:trash" class="w-4 h-4 text-red-400" />
            </UiButton>
          </div>
        </div>
      </UiCard>

      <div v-if="categories.length === 0" class="text-center py-12">
        <Icon name="heroicons:folder" class="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
        <p class="text-[var(--text-muted)]">Категорий пока нет</p>
      </div>
    </div>

    <!-- Category Modal -->
    <ClientOnly>
      <Teleport to="body">
        <Transition
          enter-active-class="transition-opacity duration-200"
          leave-active-class="transition-opacity duration-150"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
        >
          <div
            v-if="showCategoryModal"
            @click.self="closeCategoryModal"
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
            style="background-color: rgba(0, 0, 0, 0.5);"
          >
            <div
              class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
              style="background: var(--bg-surface); border: 1px solid var(--glass-border);"
            >
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-[var(--text-primary)]">
                  Создать категорию
                </h2>
                <button
                  @click="closeCategoryModal"
                  class="p-2 hover:bg-[var(--glass-bg)] rounded-lg transition-colors"
                >
                  <Icon name="heroicons:x-mark" class="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              <div v-if="categoryError" class="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                {{ categoryError }}
              </div>

              <form @submit.prevent="createCategory" class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Название *
                  </label>
                  <UiInput
                    v-model="categoryForm.name"
                    @blur="generateSlug"
                    placeholder="Например: Интернет"
                    size="lg"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    URL (slug) *
                  </label>
                  <div class="flex items-center gap-2">
                    <span class="text-[var(--text-muted)]">/</span>
                    <UiInput v-model="categoryForm.slug" placeholder="internet" class="flex-1 font-mono" />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Описание
                  </label>
                  <textarea
                    v-model="categoryForm.description"
                    placeholder="Описание категории"
                    rows="3"
                    class="w-full px-4 py-3 glass-card rounded-lg text-[var(--text-primary)] border border-[var(--glass-border)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-[var(--glass-bg)] resize-none"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Иконка
                    </label>
                    <div class="flex items-center gap-3">
                      <div class="flex-1">
                        <UiSelect
                          v-model="categoryForm.icon"
                          :options="iconOptions"
                          :placeholder="undefined"
                        />
                      </div>
                      <div class="w-12 h-12 flex items-center justify-center glass-card rounded-xl">
                        <Icon :name="categoryForm.icon" class="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Порядок сортировки
                    </label>
                    <UiInput v-model.number="categoryForm.sortOrder" type="number" placeholder="0" />
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <input
                    v-model="categoryForm.isActive"
                    type="checkbox"
                    id="categoryIsActive"
                    class="w-5 h-5 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary"
                  />
                  <label for="categoryIsActive" class="text-sm text-[var(--text-secondary)] cursor-pointer">
                    Активна
                  </label>
                </div>

                <div class="flex gap-3">
                  <UiButton :loading="savingCategory" :disabled="savingCategory" type="submit" class="flex-1">
                    Сохранить
                  </UiButton>
                  <UiButton :disabled="savingCategory" @click="closeCategoryModal" variant="ghost" class="flex-1">
                    Отмена
                  </UiButton>
                </div>
              </form>
            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>

    <!-- Service Modal -->
    <ClientOnly>
      <Teleport to="body">
        <Transition
          enter-active-class="transition-opacity duration-200"
          leave-active-class="transition-opacity duration-150"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
        >
          <div
            v-if="showServiceModal"
            @click.self="closeServiceModal"
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
            style="background-color: rgba(0, 0, 0, 0.5);"
          >
            <div
              class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
              style="background: var(--bg-surface); border: 1px solid var(--glass-border);"
            >
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-[var(--text-primary)]">
                  Создать услугу
                </h2>
                <button
                  @click="closeServiceModal"
                  class="p-2 hover:bg-[var(--glass-bg)] rounded-lg transition-colors"
                >
                  <Icon name="heroicons:x-mark" class="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              <div v-if="serviceError" class="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                {{ serviceError }}
              </div>

              <form @submit.prevent="createService" class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Название *
                  </label>
                  <UiInput v-model="serviceForm.name" placeholder="Например: Интернет 100 Мбит/с" size="lg" />
                </div>

                <UiSelect
                  v-model="serviceForm.categoryId"
                  :options="categoryOptions"
                  label="Категория"
                  placeholder="Без категории"
                />

                <div>
                  <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Краткое описание
                  </label>
                  <textarea
                    v-model="serviceForm.description"
                    placeholder="Краткое описание для карточки услуги"
                    rows="2"
                    class="w-full px-4 py-3 glass-card rounded-lg text-[var(--text-primary)] border border-[var(--glass-border)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-[var(--glass-bg)] resize-none"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Полное описание
                  </label>
                  <textarea
                    v-model="serviceForm.fullDescription"
                    placeholder="Подробное описание услуги для страницы детализации"
                    rows="4"
                    class="w-full px-4 py-3 glass-card rounded-lg text-[var(--text-primary)] border border-[var(--glass-border)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-[var(--glass-bg)] resize-none"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Ежемесячная стоимость (₽) *
                    </label>
                    <UiInput
                      v-model.number="serviceForm.priceMonthlyRub"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="500"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Стоимость подключения (₽)
                    </label>
                    <UiInput
                      v-model.number="serviceForm.priceConnectionRub"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0 — бесплатно"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    URL изображения
                  </label>
                  <UiInput v-model="serviceForm.imageUrl" placeholder="https://..." />
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Характеристики
                  </label>
                  <div class="flex gap-2 mb-3">
                    <UiInput
                      v-model="newFeature"
                      @keyup.enter.prevent="addFeature"
                      placeholder="Добавить характеристику"
                      class="flex-1"
                    />
                    <UiButton @click="addFeature" type="button" variant="secondary">
                      <Icon name="heroicons:plus" class="w-5 h-5" />
                    </UiButton>
                  </div>
                  <div v-if="serviceForm.features.length > 0" class="flex flex-wrap gap-2">
                    <span
                      v-for="(feature, index) in serviceForm.features"
                      :key="index"
                      class="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
                    >
                      {{ feature }}
                      <button
                        @click="removeFeature(index)"
                        type="button"
                        class="hover:text-red-400 transition-colors"
                      >
                        <Icon name="heroicons:x-mark" class="w-4 h-4" />
                      </button>
                    </span>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Порядок сортировки
                    </label>
                    <UiInput v-model.number="serviceForm.sortOrder" type="number" placeholder="0" />
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <input
                    v-model="serviceForm.isActive"
                    type="checkbox"
                    id="serviceIsActive"
                    class="w-5 h-5 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary"
                  />
                  <label for="serviceIsActive" class="text-sm text-[var(--text-secondary)] cursor-pointer">
                    Активна
                  </label>
                </div>

                <div class="flex gap-3">
                  <UiButton :loading="savingService" :disabled="savingService" type="submit" class="flex-1">
                    Сохранить
                  </UiButton>
                  <UiButton :disabled="savingService" @click="closeServiceModal" variant="ghost" class="flex-1">
                    Отмена
                  </UiButton>
                </div>
              </form>
            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>
  </div>
</template>
