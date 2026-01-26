<script setup lang="ts">
/**
 * AdminListFilters — обёртка для UiSearchCommand
 *
 * Преобразует FilterConfig[] в формат для UiSearchCommand
 */

import type { FilterConfig } from '~/types/admin-list'
import type { FilterGroup } from '~/components/ui/UiSearchCommand.vue'

interface Props {
  /** Конфигурация фильтров */
  filters?: FilterConfig[]
  /** Placeholder для поиска */
  searchPlaceholder?: string
  /** Показать поиск */
  showSearch?: boolean
  /** Количество результатов */
  resultsCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  filters: () => [],
  searchPlaceholder: 'Поиск...',
  showSearch: true,
})

// Models
const searchQuery = defineModel<string>('search', { default: '' })
const filterValues = defineModel<Record<string, unknown>>('values', { default: () => ({}) })

// Локальное состояние для UiSearchCommand
const localFilters = ref<Record<string, string | string[]>>({})

// Флаг для предотвращения бесконечного цикла watchers
let isSyncing = false

// Иконки для групп фильтров
const groupIcons: Record<string, string> = {
  status: 'heroicons:signal',
  priority: 'heroicons:flag',
  contractStatus: 'heroicons:document-text',
  assignedToMe: 'heroicons:user',
  inCoverage: 'heroicons:map-pin',
}

// Преобразование FilterConfig[] в FilterGroup[]
const filterGroups = computed<FilterGroup[]>(() => {
  const groups: FilterGroup[] = []

  for (const filter of props.filters) {
    if (filter.type === 'buttons' || filter.type === 'select') {
      // Фильтруем опцию "all" - она не нужна в UI
      const options = filter.options
        .filter(opt => opt.value !== 'all')
        .map(opt => ({
          value: opt.value,
          label: opt.label,
        }))

      if (options.length > 0) {
        groups.push({
          key: filter.key,
          label: getGroupLabel(filter),
          icon: groupIcons[filter.key],
          options,
          multiple: false,
        })
      }
    }
    else if (filter.type === 'checkbox') {
      // Checkbox как группа с одной опцией
      groups.push({
        key: filter.key,
        label: filter.label,
        icon: groupIcons[filter.key],
        options: [{ value: 'true', label: filter.label }],
        multiple: false,
      })
    }
  }

  return groups
})

// Получить label для группы
function getGroupLabel(filter: FilterConfig): string {
  const labels: Record<string, string> = {
    status: 'Статус',
    priority: 'Приоритет',
    contractStatus: 'Договор',
  }
  return labels[filter.key] || filter.key
}

// Синхронизация: filterValues → localFilters
function syncFromParent() {
  if (isSyncing) return
  isSyncing = true

  const result: Record<string, string | string[]> = {}

  for (const filter of props.filters) {
    const value = filterValues.value[filter.key]

    if (filter.type === 'checkbox') {
      result[filter.key] = value ? 'true' : 'all'
    }
    else {
      result[filter.key] = (value as string) || 'all'
    }
  }

  localFilters.value = result
  nextTick(() => {
    isSyncing = false
  })
}

// Синхронизация: localFilters → filterValues
function syncToParent() {
  if (isSyncing) return
  isSyncing = true

  const newValues = { ...filterValues.value }

  for (const filter of props.filters) {
    const value = localFilters.value[filter.key]

    if (filter.type === 'checkbox') {
      newValues[filter.key] = value === 'true'
    }
    else {
      newValues[filter.key] = value || 'all'
    }
  }

  filterValues.value = newValues
  nextTick(() => {
    isSyncing = false
  })
}

// Watch localFilters для синхронизации с родителем
watch(localFilters, syncToParent, { deep: true })

// Watch filterValues для синхронизации с localFilters
watch(
  () => filterValues.value,
  syncFromParent,
  { deep: true },
)

// Инициализация значений по умолчанию
onMounted(() => {
  props.filters.forEach((filter) => {
    if (filter.defaultValue !== undefined && filterValues.value[filter.key] === undefined) {
      filterValues.value[filter.key] = filter.defaultValue
    }
  })
  syncFromParent()
})
</script>

<template>
  <UiSearchCommand
    v-if="showSearch || filterGroups.length > 0"
    v-model:search="searchQuery"
    v-model:filters="localFilters"
    :placeholder="searchPlaceholder"
    :filter-groups="filterGroups"
    :results-count="resultsCount"
  />
</template>
