<script setup lang="ts">
import type { ServiceCategory, Service } from '~/types/admin'
import { ACTIVE_STATUS, getStatusBadgeClass, getStatusLabel } from '~/composables/useStatusConfig'
import { formatPrice } from '~/composables/useFormatters'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Каталог услуг — Админ-панель' })

const toast = useToast()
const router = useRouter()

const activeTab = ref<'categories' | 'services'>('services')
const loading = ref(false)
const categories = ref<ServiceCategory[]>([])
const services = ref<Service[]>([])
const selectedCategoryId = ref<string | null>(null)

function getActiveStatus(isActive: boolean) {
  return isActive ? 'active' : 'inactive'
}

function goToEditService(item: Service) {
  router.push(`/catalog/services/${item.id}/edit`)
}

function goToEditCategory(item: ServiceCategory) {
  router.push(`/catalog/categories/${item.id}/edit`)
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

// Кнопка «Стрелка вверх»
const pageRootRef = ref<HTMLElement | null>(null)
const { showScrollTop, scrollToTop } = useScrollToTop(pageRootRef)
</script>

<template>
  <div ref="pageRootRef" class="catalog-page">
    <!-- Hero -->
    <header class="catalog-page__hero">
      <div class="catalog-page__hero-bg" aria-hidden="true" />
      <div class="catalog-page__hero-inner">
        <div class="flex items-center gap-3 mb-2">
          <div class="catalog-page__hero-icon">
            <Icon name="heroicons:squares-2x2" class="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 class="catalog-page__hero-title">Каталог услуг</h1>
            <p class="catalog-page__hero-subtitle">Услуги и категории</p>
          </div>
        </div>
        <div class="catalog-page__stats">
          <span class="catalog-page__stat"><strong>{{ services.length }}</strong> услуг</span>
          <span class="catalog-page__stat"><strong>{{ categories.length }}</strong> категорий</span>
        </div>
      </div>
    </header>

    <!-- Табы и кнопки -->
    <div class="catalog-page__toolbar">
      <nav class="catalog-page__nav" aria-label="Услуги или категории">
        <button
          type="button"
          class="catalog-page__nav-item"
          :class="{ 'catalog-page__nav-item--active': activeTab === 'services' }"
          @click="activeTab = 'services'"
        >
          Услуги ({{ services.length }})
        </button>
        <button
          type="button"
          class="catalog-page__nav-item"
          :class="{ 'catalog-page__nav-item--active': activeTab === 'categories' }"
          @click="activeTab = 'categories'"
        >
          Категории ({{ categories.length }})
        </button>
      </nav>
      <div class="catalog-page__bar-row">
        <div v-if="activeTab === 'services'" class="catalog-page__filters">
          <button
            type="button"
            class="catalog-page__filter-btn"
            :class="{ 'catalog-page__filter-btn--active': selectedCategoryId === null }"
            @click="selectedCategoryId = null"
          >
            Все
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            type="button"
            class="catalog-page__filter-btn"
            :class="{ 'catalog-page__filter-btn--active': selectedCategoryId === cat.id }"
            @click="selectedCategoryId = cat.id"
          >
            {{ cat.name }}
          </button>
        </div>
        <div class="catalog-page__actions">
          <NuxtLink to="/catalog/categories/create" class="catalog-page__btn catalog-page__btn--secondary">
            <Icon name="heroicons:folder-plus" class="w-4 h-4" />
            <span>Категория</span>
          </NuxtLink>
          <NuxtLink to="/catalog/services/create" class="catalog-page__btn catalog-page__btn--primary">
            <Icon name="heroicons:plus" class="w-4 h-4" />
            <span>Услуга</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Услуги -->
    <div v-if="activeTab === 'services'" class="catalog-page__list-wrap">
      <UiLoading v-if="loading" class="catalog-page__loading" />
      <div v-else class="catalog-page__list">
        <article
          v-for="item in services"
          :key="item.id"
          class="catalog-page__card"
          @click="goToEditService(item)"
        >
          <div class="catalog-page__card-body">
            <div class="catalog-page__card-top">
              <span class="catalog-page__card-name">{{ item.name }}</span>
              <span class="catalog-page__card-price">{{ formatPrice(item.priceMonthly) }}/мес</span>
            </div>
            <p v-if="item.description" class="catalog-page__card-desc">{{ item.description }}</p>
            <div class="catalog-page__card-meta">
              <UiBadge :class="getStatusBadgeClass(ACTIVE_STATUS, getActiveStatus(item.isActive))" size="sm">
                {{ getStatusLabel(ACTIVE_STATUS, getActiveStatus(item.isActive)) }}
              </UiBadge>
              <UiBadge v-if="item.category" size="sm" class="bg-secondary/20 text-secondary">
                {{ item.category.name }}
              </UiBadge>
              <span v-if="item.priceConnection" class="catalog-page__card-connection">
                Подключение: {{ formatPrice(item.priceConnection) }}
              </span>
            </div>
          </div>
          <div class="catalog-page__card-actions" @click.stop>
            <UiButton variant="ghost" size="sm" title="Редактировать" @click="goToEditService(item)">
              <Icon name="heroicons:pencil" class="w-4 h-4" />
            </UiButton>
            <UiButton variant="ghost" size="sm" title="Удалить" @click="deleteService(item.id)">
              <Icon name="heroicons:trash" class="w-4 h-4 text-red-400" />
            </UiButton>
          </div>
          <Icon name="heroicons:chevron-right" class="catalog-page__card-arrow" />
        </article>
        <div v-if="services.length === 0" class="catalog-page__empty">
          <Icon name="heroicons:squares-2x2" class="catalog-page__empty-icon" />
          <h2 class="catalog-page__empty-title">Услуг пока нет</h2>
          <p class="catalog-page__empty-text">Добавьте первую услугу</p>
        </div>
      </div>
    </div>

    <!-- Категории -->
    <div v-if="activeTab === 'categories'" class="catalog-page__list">
      <article
        v-for="item in categories"
        :key="item.id"
        class="catalog-page__card"
        @click="goToEditCategory(item)"
      >
        <div class="catalog-page__card-body">
          <div class="catalog-page__card-top">
            <span class="catalog-page__card-name">
              <Icon v-if="item.icon" :name="item.icon" class="catalog-page__card-icon" />
              {{ item.name }}
            </span>
            <span class="catalog-page__card-slug">/{{ item.slug }}</span>
          </div>
          <p v-if="item.description" class="catalog-page__card-desc">{{ item.description }}</p>
          <div class="catalog-page__card-meta">
            <UiBadge :class="getStatusBadgeClass(ACTIVE_STATUS, getActiveStatus(item.isActive))" size="sm">
              {{ getStatusLabel(ACTIVE_STATUS, getActiveStatus(item.isActive)) }}
            </UiBadge>
          </div>
        </div>
        <div class="catalog-page__card-actions" @click.stop>
          <UiButton variant="ghost" size="sm" title="Редактировать" @click="goToEditCategory(item)">
            <Icon name="heroicons:pencil" class="w-4 h-4" />
          </UiButton>
          <UiButton variant="ghost" size="sm" title="Удалить" @click="deleteCategory(item.id)">
            <Icon name="heroicons:trash" class="w-4 h-4 text-red-400" />
          </UiButton>
        </div>
        <Icon name="heroicons:chevron-right" class="catalog-page__card-arrow" />
      </article>
      <div v-if="categories.length === 0" class="catalog-page__empty">
        <Icon name="heroicons:folder" class="catalog-page__empty-icon" />
        <h2 class="catalog-page__empty-title">Категорий пока нет</h2>
        <p class="catalog-page__empty-text">Добавьте первую категорию</p>
      </div>
    </div>

    <Transition name="catalog-page-scroll-top">
      <button
        v-if="showScrollTop"
        type="button"
        class="catalog-page__scroll-top"
        aria-label="Прокрутить вверх"
        @click="scrollToTop"
      >
        <Icon name="heroicons:arrow-up" class="w-5 h-5" />
      </button>
    </Transition>
  </div>
</template>
