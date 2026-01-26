<script setup lang="ts">
/**
 * UiSearchCommand — умная строка поиска с фильтрами
 *
 * Фичи:
 * - Glass-стиль с градиентной рамкой при фокусе
 * - Dropdown с доступными фильтрами
 * - Активные фильтры как removable chips
 * - Keyboard navigation (↑↓ Enter Esc)
 */

export interface FilterOption {
  value: string
  label: string
  icon?: string
}

export interface FilterGroup {
  key: string
  label: string
  icon?: string
  options: FilterOption[]
  multiple?: boolean
}

interface Props {
  /** Placeholder для поиска */
  placeholder?: string
  /** Группы фильтров */
  filterGroups?: FilterGroup[]
  /** Показать количество результатов */
  resultsCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Поиск...',
  filterGroups: () => [],
})

// Models
const searchQuery = defineModel<string>('search', { default: '' })
const activeFilters = defineModel<Record<string, string | string[]>>('filters', { default: () => ({}) })

// State
const inputRef = ref<HTMLInputElement>()
const isOpen = ref(false)
const focusedGroupIndex = ref(0)
const focusedOptionIndex = ref(0)

// Computed
const hasActiveFilters = computed(() => {
  return Object.entries(activeFilters.value).some(([_, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value && value !== 'all'
  })
})

const activeFilterChips = computed(() => {
  const chips: { key: string, groupLabel: string, value: string, label: string }[] = []

  for (const group of props.filterGroups) {
    const value = activeFilters.value[group.key]
    if (!value || value === 'all') continue

    if (Array.isArray(value)) {
      for (const v of value) {
        const opt = group.options.find(o => o.value === v)
        if (opt) {
          chips.push({ key: group.key, groupLabel: group.label, value: v, label: opt.label })
        }
      }
    }
    else {
      const opt = group.options.find(o => o.value === value)
      if (opt) {
        chips.push({ key: group.key, groupLabel: group.label, value, label: opt.label })
      }
    }
  }

  return chips
})

// Methods
function toggleFilter(groupKey: string, optionValue: string) {
  const group = props.filterGroups.find(g => g.key === groupKey)
  if (!group) return

  if (group.multiple) {
    const current = (activeFilters.value[groupKey] as string[]) || []
    const index = current.indexOf(optionValue)
    if (index >= 0) {
      activeFilters.value[groupKey] = current.filter(v => v !== optionValue)
    }
    else {
      activeFilters.value[groupKey] = [...current, optionValue]
    }
  }
  else {
    // Single select - toggle or set
    if (activeFilters.value[groupKey] === optionValue) {
      activeFilters.value[groupKey] = 'all'
    }
    else {
      activeFilters.value[groupKey] = optionValue
    }
  }
}

function removeFilter(groupKey: string, value: string) {
  const group = props.filterGroups.find(g => g.key === groupKey)
  if (!group) return

  if (group.multiple) {
    const current = (activeFilters.value[groupKey] as string[]) || []
    activeFilters.value[groupKey] = current.filter(v => v !== value)
  }
  else {
    activeFilters.value[groupKey] = 'all'
  }
}

function clearAllFilters() {
  for (const group of props.filterGroups) {
    activeFilters.value[group.key] = group.multiple ? [] : 'all'
  }
}

function isFilterActive(groupKey: string, optionValue: string): boolean {
  const value = activeFilters.value[groupKey]
  if (Array.isArray(value)) {
    return value.includes(optionValue)
  }
  return value === optionValue
}

// Keyboard navigation
function handleKeydown(e: KeyboardEvent) {
  if (!isOpen.value) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      isOpen.value = true
      e.preventDefault()
    }
    return
  }

  switch (e.key) {
    case 'Escape':
      isOpen.value = false
      inputRef.value?.focus()
      break
    case 'ArrowDown':
      e.preventDefault()
      navigateOptions(1)
      break
    case 'ArrowUp':
      e.preventDefault()
      navigateOptions(-1)
      break
    case 'Enter':
      e.preventDefault()
      selectFocusedOption()
      break
  }
}

function navigateOptions(direction: number) {
  const group = props.filterGroups[focusedGroupIndex.value]
  if (!group) return

  const newOptionIndex = focusedOptionIndex.value + direction

  if (newOptionIndex < 0) {
    // Move to previous group
    if (focusedGroupIndex.value > 0) {
      focusedGroupIndex.value--
      focusedOptionIndex.value = props.filterGroups[focusedGroupIndex.value].options.length - 1
    }
  }
  else if (newOptionIndex >= group.options.length) {
    // Move to next group
    if (focusedGroupIndex.value < props.filterGroups.length - 1) {
      focusedGroupIndex.value++
      focusedOptionIndex.value = 0
    }
  }
  else {
    focusedOptionIndex.value = newOptionIndex
  }
}

function selectFocusedOption() {
  const group = props.filterGroups[focusedGroupIndex.value]
  const option = group?.options[focusedOptionIndex.value]
  if (group && option) {
    toggleFilter(group.key, option.value)
  }
}

// Close on click outside
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.search-command')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="search-command">
    <!-- Search Input with gradient border on focus -->
    <div :class="['search-input-wrapper', isOpen && 'is-focused']">
      <div class="search-input-inner">
        <Icon name="heroicons:magnifying-glass" class="search-icon" />

        <input
          ref="inputRef"
          v-model="searchQuery"
          :placeholder="placeholder"
          @focus="isOpen = true"
          @keydown="handleKeydown"
          type="text"
          class="search-input"
        >

        <!-- Results count -->
        <span v-if="resultsCount !== undefined" class="results-count">
          {{ resultsCount }}
        </span>

        <!-- Filter button -->
        <button
          v-if="filterGroups.length > 0"
          :class="['filter-toggle', hasActiveFilters && 'has-filters']"
          @click="isOpen = !isOpen"
          type="button"
        >
          <Icon name="heroicons:funnel" class="w-4 h-4" />
          <span v-if="hasActiveFilters" class="filter-count">{{ activeFilterChips.length }}</span>
        </button>
      </div>
    </div>

    <!-- Active filters chips -->
    <Transition name="chips">
      <div v-if="activeFilterChips.length > 0" class="active-chips">
        <button
          v-for="chip in activeFilterChips"
          :key="`${chip.key}-${chip.value}`"
          @click="removeFilter(chip.key, chip.value)"
          class="chip"
          type="button"
        >
          <span class="chip-label">{{ chip.label }}</span>
          <Icon name="heroicons:x-mark" class="chip-remove" />
        </button>

        <button
          v-if="activeFilterChips.length > 1"
          @click="clearAllFilters"
          class="chip chip-clear"
          type="button"
        >
          Сбросить все
        </button>
      </div>
    </Transition>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div v-if="isOpen && filterGroups.length > 0" class="dropdown">
        <div class="dropdown-header">
          <span class="dropdown-title">Фильтры</span>
          <kbd class="kbd">↑↓</kbd>
          <span class="dropdown-hint">навигация</span>
          <kbd class="kbd">Enter</kbd>
          <span class="dropdown-hint">выбор</span>
          <kbd class="kbd">Esc</kbd>
          <span class="dropdown-hint">закрыть</span>
        </div>

        <div class="dropdown-content">
          <div
            v-for="(group, groupIdx) in filterGroups"
            :key="group.key"
            class="filter-group"
          >
            <div class="group-label">
              <Icon v-if="group.icon" :name="group.icon" class="w-4 h-4" />
              {{ group.label }}
            </div>

            <div class="group-options">
              <button
                v-for="(option, optIdx) in group.options"
                :key="option.value"
                :class="[
                  'option',
                  isFilterActive(group.key, option.value) && 'is-active',
                  focusedGroupIndex === groupIdx && focusedOptionIndex === optIdx && 'is-focused',
                ]"
                @click="toggleFilter(group.key, option.value)"
                @mouseenter="focusedGroupIndex = groupIdx; focusedOptionIndex = optIdx"
                type="button"
              >
                <Icon v-if="option.icon" :name="option.icon" class="w-3.5 h-3.5" />
                {{ option.label }}
                <Icon
                  v-if="isFilterActive(group.key, option.value)"
                  name="heroicons:check"
                  class="check-icon"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.search-command {
  position: relative;
  width: 100%;
}

/* Search Input */
.search-input-wrapper {
  position: relative;
  border-radius: 0.75rem;
  padding: 1px;
  background: var(--glass-border);
  transition: all 0.3s ease;
}

.search-input-wrapper.is-focused {
  background: linear-gradient(135deg, rgba(247, 148, 29, 0.5), rgba(233, 30, 140, 0.3));
  box-shadow: 0 0 12px rgba(247, 148, 29, 0.1);
}

.search-input-inner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--glass-bg);
  border-radius: 0.7rem;
  backdrop-filter: blur(10px);
}

.search-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.9375rem;
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.results-count {
  font-size: 0.75rem;
  color: var(--text-muted);
  padding: 0.125rem 0.5rem;
  background: var(--glass-bg);
  border-radius: 0.375rem;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.625rem;
  border-radius: 0.5rem;
  background: transparent;
  border: 1px solid var(--glass-border);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-toggle:hover {
  color: var(--text-primary);
  border-color: var(--text-muted);
}

.filter-toggle.has-filters {
  background: linear-gradient(135deg, rgba(247, 148, 29, 0.15), rgba(233, 30, 140, 0.15));
  border-color: rgba(247, 148, 29, 0.3);
  color: #F7941D;
}

.filter-count {
  font-size: 0.6875rem;
  font-weight: 600;
  min-width: 1rem;
  text-align: center;
}

/* Active Chips */
.active-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.chip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: linear-gradient(135deg, rgba(247, 148, 29, 0.15), rgba(233, 30, 140, 0.15));
  border: 1px solid rgba(247, 148, 29, 0.25);
  border-radius: 9999px;
  font-size: 0.8125rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.chip:hover {
  background: linear-gradient(135deg, rgba(247, 148, 29, 0.25), rgba(233, 30, 140, 0.25));
  border-color: rgba(247, 148, 29, 0.4);
}

.chip-label {
  font-weight: 500;
}

.chip-remove {
  width: 0.875rem;
  height: 0.875rem;
  opacity: 0.6;
}

.chip:hover .chip-remove {
  opacity: 1;
}

.chip-clear {
  background: var(--glass-bg);
  border-color: var(--glass-border);
  color: var(--text-muted);
}

.chip-clear:hover {
  color: var(--text-primary);
  border-color: var(--text-secondary);
}

/* Dropdown */
.dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--bg-elevated);
  border: 1px solid var(--glass-border);
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--glass-border);
  font-size: 0.75rem;
}

.dropdown-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-right: auto;
}

.dropdown-hint {
  color: var(--text-muted);
}

.kbd {
  padding: 0.125rem 0.375rem;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 0.25rem;
  font-family: ui-monospace, monospace;
  font-size: 0.625rem;
  color: var(--text-secondary);
}

.dropdown-content {
  padding: 0.75rem;
  max-height: 20rem;
  overflow-y: auto;
}

.filter-group {
  margin-bottom: 1rem;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.group-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.group-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.option {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.option:hover,
.option.is-focused {
  background: var(--bg-elevated);
  border-color: var(--text-muted);
  color: var(--text-primary);
}

.option.is-active {
  background: linear-gradient(135deg, rgba(247, 148, 29, 0.15), rgba(233, 30, 140, 0.15));
  border-color: rgba(247, 148, 29, 0.4);
  color: var(--text-primary);
}

.option.is-active:hover,
.option.is-active.is-focused {
  background: linear-gradient(135deg, rgba(247, 148, 29, 0.25), rgba(233, 30, 140, 0.25));
}

.check-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: #F7941D;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.chips-enter-active,
.chips-leave-active {
  transition: all 0.2s ease;
}

.chips-enter-from,
.chips-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}
</style>
