<script setup lang="ts">
import type { ColumnConfig, FilterConfig, RowActionConfig } from '~/types/admin-list'
import {
  CALLBACK_REQUEST_STATUS,
  CALLBACK_STATUS_OPTIONS,
} from '~/composables/useStatusConfig'
import { useAdminList } from '~/composables/useAdminList'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Обратный звонок — Админ-панель' })

const toast = useToast()
const router = useRouter()

// Конфигурация колонок
const columns: ColumnConfig[] = [
  { key: 'name', label: 'Имя' },
  { key: 'phone', label: 'Телефон', format: 'phone' },
  { key: 'status', label: 'Статус', badge: { config: CALLBACK_REQUEST_STATUS } },
  { key: 'source', label: 'Источник' },
  { key: 'processedBy', label: 'Обработал' },
  { key: 'createdAt', label: 'Создана', sortable: true, format: 'relative' },
]

// Конфигурация фильтров
const filters: FilterConfig[] = [
  { key: 'status', type: 'buttons', options: CALLBACK_STATUS_OPTIONS, defaultValue: 'all' },
]

// Используем composable для списка
const {
  items,
  loading,
  total,
  filters: filterValues,
  searchQuery,
  onSearchInput,
  fetchItems,
} = useAdminList<Record<string, unknown>, Record<string, unknown>>({
  endpoint: '/api/admin/callback-requests',
  responseKey: 'requests',
  initialFilters: {
    status: 'all',
  },
})

// Состояние для панели фильтров
const filtersExpanded = ref(true)

// Обновление статуса заявки
async function updateStatus(id: string, status: string) {
  try {
    await $fetch(`/api/admin/callback-requests/${id}`, {
      method: 'PATCH',
      body: { status },
    })
    toast.success('Статус обновлён')
    // Перезагрузка списка
    await fetchItems()
  }
  catch {
    toast.error('Ошибка обновления статуса')
  }
}

// Hover-действия
const rowActions: RowActionConfig[] = [
  {
    key: 'call',
    icon: 'heroicons:phone',
    label: 'Позвонить',
    visible: row => !!row.phone,
    href: row => `tel:${row.phone}`,
  },
  {
    key: 'status',
    icon: 'heroicons:arrow-path',
    label: 'Сменить статус',
    dropdown: {
      options: CALLBACK_STATUS_OPTIONS.filter(o => o.value !== 'all'),
      onSelect: (row, value) => updateStatus(row.id as string, value),
    },
  },
]

// Сброс фильтров
function resetFilters() {
  filterValues.value.status = 'all'
}

// Проверка активных фильтров
const hasActiveFilters = computed(() => {
  return filterValues.value.status !== 'all'
})
</script>

<template>
  <div class="flex gap-6">
    <!-- Левая колонка: Заголовок, поиск, кнопки и таблица -->
    <div class="flex-1 min-w-0">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-4 mb-4">
          <h1 class="flex items-center gap-3 text-3xl font-bold text-[var(--text-primary)] whitespace-nowrap flex-shrink-0">
            <Icon name="heroicons:clipboard-document-list" class="h-8 w-8 text-[#F7941D]" />
            Заявки
            <span v-if="total > 0" class="text-lg font-normal text-[var(--text-muted)]">
              ({{ total }})
            </span>
          </h1>
          
          <UiInput
            v-model="searchQuery"
            placeholder="Поиск по имени или телефону..."
            @input="onSearchInput"
            class="flex-1 min-w-0"
          >
            <template #prefix>
              <Icon name="heroicons:magnifying-glass" class="w-4 h-4" />
            </template>
          </UiInput>
          
          <div class="flex gap-2 flex-shrink-0">
            <NuxtLink to="/requests/connection" class="u-btn u-btn--secondary u-btn--md">
              <Icon name="heroicons:signal" class="h-4 w-4" />
              Подключение
            </NuxtLink>
            <NuxtLink to="/requests/callback" class="u-btn u-btn--primary u-btn--md">
              <Icon name="heroicons:phone-arrow-up-right" class="h-4 w-4" />
              Обратный звонок
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="relative min-h-[400px]">
        <Transition name="fade" mode="out-in">
          <AdminListTable
            v-if="!loading"
            :key="`table-${filterValues.status}`"
            :data="items"
            :columns="columns"
            :row-key="'id'"
            :row-actions="rowActions"
            :empty-icon="'heroicons:phone-arrow-up-right'"
            :empty-text="'Заявок не найдено'"
            :loading="false"
          >
        <!-- Имя -->
        <template #name="{ row }">
          <span class="font-medium text-[var(--text-primary)]">{{ (row as Record<string, unknown>).name }}</span>
        </template>

        <!-- Источник -->
        <template #source="{ row }">
          <span class="text-sm text-[var(--text-muted)]">{{ (row as Record<string, unknown>).source || '—' }}</span>
        </template>

        <!-- Обработал -->
        <template #processedBy="{ row }">
          <span class="text-sm text-[var(--text-muted)]">
            {{ ((row as Record<string, unknown>).processedBy as { fullName?: string })?.fullName || '—' }}
          </span>
        </template>
      </AdminListTable>
      <div v-else class="absolute inset-0 flex items-center justify-center">
        <UiLoading />
      </div>
      </Transition>
      </div>
    </div>

    <!-- Правая колонка: Панель фильтров -->
    <aside class="hidden lg:block w-72 flex-shrink-0 sticky top-6 self-start">
      <div class="glass-card rounded-xl border border-[var(--glass-border)] backdrop-blur-sm overflow-hidden">
        <!-- Заголовок панели с кнопкой сворачивания -->
        <button
          @click="filtersExpanded = !filtersExpanded"
          class="w-full flex items-center justify-between p-4 hover:bg-[var(--glass-bg)] transition-colors"
        >
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <Icon name="heroicons:funnel" class="w-5 h-5 text-[var(--text-primary)] flex-shrink-0" />
            <span class="font-semibold text-[var(--text-primary)]">Фильтры</span>
            
            <!-- Кнопка сброса фильтров -->
            <UiButton
              :class="[
                'flex-shrink-0 ml-2 transition-opacity',
                hasActiveFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              ]"
              @click.stop="resetFilters"
              variant="ghost"
              size="sm"
            >
              <Icon name="heroicons:arrow-path" class="w-4 h-4" />
              Сбросить
            </UiButton>
          </div>
          
          <Icon
            :name="filtersExpanded ? 'heroicons:chevron-up' : 'heroicons:chevron-down'"
            class="w-5 h-5 text-[var(--text-muted)] transition-transform"
          />
        </button>

        <!-- Содержимое панели -->
        <Transition name="slide">
          <div v-if="filtersExpanded" class="px-4 pb-4 space-y-4">
            <!-- Статус -->
            <div>
              <label class="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wide">
                Статус
              </label>
              <!-- Кнопка "Все" отдельно -->
              <UiButton
                :variant="filterValues.status === 'all' ? 'primary' : 'ghost'"
                :class="[
                  'w-full mb-2 status-filter-btn',
                  filterValues.status === 'all' 
                    ? 'bg-primary/20 text-primary font-medium scale-[1.02]' 
                    : 'hover:bg-[var(--glass-bg)]'
                ]"
                size="sm"
                @click="filterValues.status = 'all'"
              >
                <Icon
                  v-if="filterValues.status === 'all'"
                  name="heroicons:check"
                  class="w-4 h-4 flex-shrink-0 text-primary"
                />
                <span v-else class="w-4"></span>
                <span class="text-left">Все</span>
              </UiButton>
              <!-- Остальные кнопки в колонку -->
              <div class="flex flex-col gap-1">
                <UiButton
                  v-for="opt in CALLBACK_STATUS_OPTIONS.filter(o => o.value !== 'all')"
                  :key="opt.value"
                  :variant="filterValues.status === opt.value ? 'primary' : 'ghost'"
                  :class="[
                    'status-filter-btn w-full',
                    filterValues.status === opt.value 
                      ? 'bg-primary/20 text-primary font-medium scale-[1.02]' 
                      : 'hover:bg-[var(--glass-bg)]'
                  ]"
                  size="sm"
                  @click="filterValues.status = opt.value"
                >
                  <Icon
                    v-if="filterValues.status === opt.value"
                    name="heroicons:check"
                    class="w-4 h-4 flex-shrink-0 text-primary"
                  />
                  <span v-else class="w-4"></span>
                  <span class="text-left">{{ opt.label }}</span>
                </UiButton>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* Анимация сворачивания/разворачивания панели фильтров */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 500px;
  opacity: 1;
}

/* Выравнивание кнопок статусов слева */
:deep(.status-filter-btn) {
  justify-content: flex-start !important;
  text-align: left !important;
}

:deep(.status-filter-btn span) {
  text-align: left !important;
}

/* Плавные переходы для таблицы */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
