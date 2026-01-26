<script setup lang="ts">
import type { ServiceCategory, Service } from '~/types/admin'
import { ACTIVE_STATUS, getStatusBadgeClass, getStatusLabel } from '~/composables/useStatusConfig'

const toast = useToast()

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Каталог услуг — Админ-панель' })

const router = useRouter()

const activeTab = ref<'categories' | 'services'>('services')
const loading = ref(false)
const categories = ref<ServiceCategory[]>([])
const services = ref<Service[]>([])
const selectedCategoryId = ref<string | null>(null)

// Helper to convert boolean isActive to status key
const getActiveStatus = (isActive: boolean) => isActive ? 'active' : 'inactive'

const fetchCategories = async () => {
  try {
    const data = await $fetch<{ categories: ServiceCategory[] }>('/api/admin/catalog/categories')
    categories.value = data.categories
  }
  catch {
    toast.error('Не удалось загрузить категории')
  }
}

const fetchServices = async () => {
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

const deleteCategory = async (id: string) => {
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

const deleteService = async (id: string) => {
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
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <h1 class="text-3xl font-bold text-[var(--text-primary)]">
        Каталог услуг
      </h1>
      <div class="flex gap-2">
        <UiButton variant="secondary" @click="router.push('/catalog/categories/create')">
          <Icon name="heroicons:folder-plus" class="w-5 h-5" />
          Категория
        </UiButton>
        <UiButton @click="router.push('/catalog/services/create')">
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
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
        @click="activeTab = 'services'"
      >
        Услуги ({{ services.length }})
      </button>
      <button
        :class="activeTab === 'categories'
          ? 'border-primary text-primary'
          : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'"
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
        @click="activeTab = 'categories'"
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
          variant="ghost"
          size="sm"
          @click="selectedCategoryId = null"
        >
          Все
        </UiButton>
        <UiButton
          v-for="cat in categories"
          :key="cat.id"
          :class="{ 'bg-primary/20': selectedCategoryId === cat.id }"
          variant="ghost"
          size="sm"
          @click="selectedCategoryId = cat.id"
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
                variant="ghost"
                size="sm"
                title="Редактировать"
                @click="router.push(`/catalog/services/${item.id}/edit`)"
              >
                <Icon name="heroicons:pencil" class="w-4 h-4" />
              </UiButton>
              <UiButton
                variant="ghost"
                size="sm"
                title="Удалить"
                @click="deleteService(item.id)"
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
              variant="ghost"
              size="sm"
              title="Редактировать"
              @click="router.push(`/catalog/categories/${item.id}/edit`)"
            >
              <Icon name="heroicons:pencil" class="w-4 h-4" />
            </UiButton>
            <UiButton
              variant="ghost"
              size="sm"
              title="Удалить"
              @click="deleteCategory(item.id)"
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
  </div>
</template>
