<script setup lang="ts">
/**
 * AdminListPage — универсальный компонент страницы со списком
 *
 * Объединяет: заголовок, фильтры, таблицу, пустое состояние
 * Конфигурируется через props, кастомизируется через слоты
 */

import type { ColumnConfig, FilterConfig, RowActionConfig } from '~/types/admin-list'
import { useAdminList } from '~/composables/useAdminList'

interface Props {
  /** Заголовок страницы */
  title: string
  /** Иконка заголовка */
  icon: string
  /** API endpoint */
  endpoint: string
  /** Ключ массива в ответе API */
  responseKey: string
  /** Ключ для идентификации строк */
  rowKey?: string
  /** Конфигурация колонок */
  columns: ColumnConfig[]
  /** Конфигурация фильтров */
  filters?: FilterConfig[]
  /** Placeholder поиска */
  searchPlaceholder?: string
  /** Hover-действия */
  rowActions?: RowActionConfig[]
  /** Иконка пустого состояния */
  emptyIcon?: string
  /** Текст пустого состояния */
  emptyText?: string
  /** Показать кнопку "Создать" */
  showCreateButton?: boolean
  /** URL для кнопки "Создать" */
  createUrl?: string
  /** Трансформация параметров запроса */
  transformParams?: (filters: Record<string, unknown>) => Record<string, string | null | undefined>
  /** Использовать виртуализацию */
  virtualize?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  filters: () => [],
  searchPlaceholder: 'Поиск...',
  rowActions: () => [],
  emptyIcon: 'heroicons:inbox',
  emptyText: 'Данные не найдены',
  showCreateButton: false,
  virtualize: false,
})

const emit = defineEmits<{
  'row-click': [row: Record<string, unknown>]
}>()

const router = useRouter()

// Получаем начальные значения фильтров из конфигурации
const initialFilters = computed(() => {
  const result: Record<string, unknown> = {}
  props.filters.forEach((filter) => {
    if (filter.defaultValue !== undefined) {
      result[filter.key] = filter.defaultValue
    }
    else if (filter.type === 'checkbox') {
      result[filter.key] = false
    }
    else {
      result[filter.key] = 'all'
    }
  })
  return result
})

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
  endpoint: props.endpoint,
  responseKey: props.responseKey,
  initialFilters: initialFilters.value,
  transformParams: props.transformParams,
})

// Синхронизация поиска с debounce
watch(searchQuery, () => {
  onSearchInput()
})

// Обработка клика по строке
function handleRowClick(row: Record<string, unknown>) {
  emit('row-click', row)
}

// Переход к созданию
function goToCreate() {
  if (props.createUrl) {
    router.push(props.createUrl)
  }
}

// Expose для доступа извне
defineExpose({
  items,
  loading,
  total,
  filters: filterValues,
  searchQuery,
  fetchItems,
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <h1 class="flex items-center gap-3 text-3xl font-bold text-[var(--text-primary)]">
        <Icon :name="icon" class="h-8 w-8" />
        {{ title }}
        <span v-if="total > 0" class="text-lg font-normal text-[var(--text-muted)]">
          ({{ total }})
        </span>
      </h1>

      <slot name="header-actions">
        <UiButton v-if="showCreateButton" @click="goToCreate">
          <Icon name="heroicons:plus" class="h-4 w-4" />
          Создать
        </UiButton>
      </slot>
    </div>

    <!-- Filters -->
    <AdminListFilters
      v-if="filters.length > 0 || searchPlaceholder"
      v-model:search="searchQuery"
      v-model:values="filterValues"
      :filters="filters"
      :search-placeholder="searchPlaceholder"
      :show-search="!!searchPlaceholder"
      :results-count="total"
    />

    <!-- Table -->
    <AdminListTable
      :data="items"
      :columns="columns"
      :row-key="rowKey"
      :row-actions="rowActions"
      :empty-icon="emptyIcon"
      :empty-text="emptyText"
      :loading="loading"
      :virtualize="virtualize"
      @row-click="handleRowClick"
    >
      <!-- Пробрасываем все слоты для колонок -->
      <template v-for="col in columns" :key="col.key" #[col.key]="slotProps">
        <slot :name="col.key" v-bind="slotProps" />
      </template>
    </AdminListTable>
  </div>
</template>
