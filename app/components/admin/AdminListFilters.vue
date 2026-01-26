<script setup lang="ts">
/**
 * AdminListFilters — унифицированная панель фильтров
 *
 * Layout: [Кнопки статуса] [Доп. фильтры (select/checkbox)] [Поиск справа]
 */

import type { FilterConfig } from '~/types/admin-list'

interface Props {
  /** Конфигурация фильтров */
  filters?: FilterConfig[]
  /** Placeholder для поиска */
  searchPlaceholder?: string
  /** Показать поиск */
  showSearch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  filters: () => [],
  searchPlaceholder: 'Поиск...',
  showSearch: true,
})

// Модели для v-model
const searchQuery = defineModel<string>('search', { default: '' })
const filterValues = defineModel<Record<string, unknown>>('values', { default: () => ({}) })

// Инициализация значений по умолчанию
onMounted(() => {
  props.filters.forEach((filter) => {
    if (filter.defaultValue !== undefined && filterValues.value[filter.key] === undefined) {
      filterValues.value[filter.key] = filter.defaultValue
    }
  })
})

// Группировка фильтров по типу
const buttonFilters = computed(() => props.filters.filter(f => f.type === 'buttons'))
const selectFilters = computed(() => props.filters.filter(f => f.type === 'select'))
const checkboxFilters = computed(() => props.filters.filter(f => f.type === 'checkbox'))
</script>

<template>
  <div class="admin-list-filters">
    <!-- Левая часть: все фильтры -->
    <div class="filters-group">
      <!-- Кнопки статуса (первыми) -->
      <div
        v-for="filter in buttonFilters"
        :key="filter.key"
        class="filter-buttons"
      >
        <UiButton
          v-for="opt in filter.options"
          :key="opt.value"
          :class="{ 'bg-primary/20': filterValues[filter.key] === opt.value }"
          @click="filterValues[filter.key] = opt.value"
          variant="ghost"
          size="sm"
        >
          {{ opt.label }}
        </UiButton>
      </div>

      <!-- Select фильтры -->
      <UiSelect
        v-for="filter in selectFilters"
        :key="filter.key"
        :model-value="filterValues[filter.key] as string"
        :options="filter.options"
        :placeholder="filter.placeholder"
        @update:model-value="filterValues[filter.key] = $event"
        size="sm"
        class="w-40"
      />

      <!-- Checkbox фильтры -->
      <label
        v-for="filter in checkboxFilters"
        :key="filter.key"
        class="filter-checkbox"
      >
        <input
          v-model="filterValues[filter.key]"
          type="checkbox"
          class="filter-checkbox-input"
        >
        <span class="filter-checkbox-label">{{ filter.label }}</span>
      </label>
    </div>

    <!-- Правая часть: поиск (всегда справа) -->
    <div v-if="showSearch" class="search-wrapper">
      <UiInput
        v-model="searchQuery"
        :placeholder="searchPlaceholder"
        size="sm"
        class="w-64"
      >
        <template #leading>
          <Icon name="heroicons:magnifying-glass" class="h-4 w-4 text-[var(--text-muted)]" />
        </template>
      </UiInput>
    </div>
  </div>
</template>

<style scoped>
.admin-list-filters {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filters-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.filter-buttons {
  display: flex;
  gap: 0.25rem;
}

.search-wrapper {
  flex-shrink: 0;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.filter-checkbox-input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--primary);
  cursor: pointer;
}

.filter-checkbox-label {
  user-select: none;
}

.filter-checkbox:hover .filter-checkbox-label {
  color: var(--text-primary);
}
</style>
