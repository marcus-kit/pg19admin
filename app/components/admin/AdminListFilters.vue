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

// Адаптер: filterValues ↔ UiSearchCommand filters
const searchFilters = computed({
  get() {
    const result: Record<string, string | string[]> = {}

    for (const filter of props.filters) {
      const value = filterValues.value[filter.key]

      if (filter.type === 'checkbox') {
        // Checkbox: true → 'true', false → 'all'
        result[filter.key] = value ? 'true' : 'all'
      }
      else {
        // Buttons/Select: просто копируем
        result[filter.key] = (value as string) || 'all'
      }
    }

    return result
  },
  set(newFilters: Record<string, string | string[]>) {
    for (const filter of props.filters) {
      const value = newFilters[filter.key]

      if (filter.type === 'checkbox') {
        // 'true' → true, иначе false
        filterValues.value[filter.key] = value === 'true'
      }
      else {
        // Buttons/Select: 'all' или конкретное значение
        filterValues.value[filter.key] = value || 'all'
      }
    }
  },
})

// Инициализация значений по умолчанию
onMounted(() => {
  props.filters.forEach((filter) => {
    if (filter.defaultValue !== undefined && filterValues.value[filter.key] === undefined) {
      filterValues.value[filter.key] = filter.defaultValue
    }
  })
})
</script>

<template>
  <UiSearchCommand
    v-if="showSearch || filterGroups.length > 0"
    v-model:search="searchQuery"
    v-model:filters="searchFilters"
    :placeholder="searchPlaceholder"
    :filter-groups="filterGroups"
    :results-count="resultsCount"
  />
</template>
