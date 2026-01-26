# Унификация таблиц — План реализации

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Создать единый компонент `AdminListPage` для всех страниц со списками (users, accounts, tickets, requests) с унифицированным UI, фильтрацией, поиском и виртуализацией.

**Architecture:** Конфигурационный подход — страницы передают конфиг (endpoint, columns, filters), компонент рендерит всё автоматически. Hover-действия появляются при наведении на строку. Виртуализация для производительности с большими списками.

**Tech Stack:** Vue 3.5, Nuxt 4, TypeScript, Tailwind CSS, CSS Variables

---

## Обзор задач

| # | Задача | Файлы | Сложность |
|---|--------|-------|-----------|
| 1 | Типы для AdminListPage | types/admin-list.ts | Низкая |
| 2 | Компонент UiVirtualScroll | components/ui/UiVirtualScroll.vue | Средняя |
| 3 | Компонент AdminRowActions | components/admin/AdminRowActions.vue | Средняя |
| 4 | Компонент AdminListFilters | components/admin/AdminListFilters.vue | Средняя |
| 5 | Компонент AdminListTable | components/admin/AdminListTable.vue | Средняя |
| 6 | Компонент AdminListPage | components/admin/AdminListPage.vue | Высокая |
| 7 | Компоненты ячеек | components/cells/*.vue | Низкая |
| 8 | Миграция Users | pages/users/index.vue | Низкая |
| 9 | Миграция Accounts | pages/accounts/index.vue | Низкая |
| 10 | Миграция Tickets | pages/tickets/index.vue | Средняя |
| 11 | Страница Requests Connection | pages/requests/connection/index.vue | Средняя |
| 12 | Страница Requests Callback | pages/requests/callback/index.vue | Высокая |
| 13 | Редирект Requests | pages/requests/index.vue | Низкая |

---

## Task 1: Типы для AdminListPage

**Files:**
- Create: `app/types/admin-list.ts`

**Step 1: Создать файл типов**

```typescript
// app/types/admin-list.ts

import type { StatusConfigMap, FilterOption } from '~/composables/useStatusConfig'

// ═══════════════════════════════════════════════════════════════════════════
// Конфигурация колонок
// ═══════════════════════════════════════════════════════════════════════════

export type ColumnFormat = 'date' | 'datetime' | 'relative' | 'money' | 'phone'

export interface ColumnConfig {
  /** Ключ поля в данных */
  key: string
  /** Заголовок колонки */
  label: string
  /** Разрешить сортировку */
  sortable?: boolean
  /** CSS класс ширины (Tailwind) */
  width?: string
  /** Выравнивание */
  align?: 'left' | 'center' | 'right'
  /** Встроенный форматтер */
  format?: ColumnFormat
  /** Конфиг для бейджа статуса */
  badge?: {
    config: StatusConfigMap
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Конфигурация фильтров
// ═══════════════════════════════════════════════════════════════════════════

export interface FilterConfigBase {
  /** Ключ фильтра (для API параметров) */
  key: string
  /** Значение по умолчанию */
  defaultValue?: string | boolean
}

export interface ButtonsFilterConfig extends FilterConfigBase {
  type: 'buttons'
  options: FilterOption[]
}

export interface SelectFilterConfig extends FilterConfigBase {
  type: 'select'
  options: FilterOption[]
  /** Placeholder для select */
  placeholder?: string
}

export interface CheckboxFilterConfig extends FilterConfigBase {
  type: 'checkbox'
  /** Текст рядом с checkbox */
  label: string
}

export type FilterConfig = ButtonsFilterConfig | SelectFilterConfig | CheckboxFilterConfig

// ═══════════════════════════════════════════════════════════════════════════
// Конфигурация hover-действий
// ═══════════════════════════════════════════════════════════════════════════

export interface RowActionBase<T = Record<string, unknown>> {
  /** Уникальный ключ действия */
  key: string
  /** Иконка (heroicons) */
  icon: string
  /** Подсказка при наведении */
  label: string
  /** Условие показа */
  visible?: (row: T) => boolean
}

export interface ClickRowAction<T = Record<string, unknown>> extends RowActionBase<T> {
  /** Обработчик клика */
  action: (row: T) => void
}

export interface HrefRowAction<T = Record<string, unknown>> extends RowActionBase<T> {
  /** Функция возвращающая URL */
  href: (row: T) => string
}

export interface DropdownRowAction<T = Record<string, unknown>> extends RowActionBase<T> {
  /** Конфигурация dropdown */
  dropdown: {
    options: FilterOption[]
    onSelect: (row: T, value: string) => void | Promise<void>
  }
}

export type RowActionConfig<T = Record<string, unknown>> =
  | ClickRowAction<T>
  | HrefRowAction<T>
  | DropdownRowAction<T>

// ═══════════════════════════════════════════════════════════════════════════
// Props компонента AdminListPage
// ═══════════════════════════════════════════════════════════════════════════

export interface AdminListPageProps<T = Record<string, unknown>> {
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
  rowActions?: RowActionConfig<T>[]
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
}
```

**Step 2: Проверить TypeScript**

Run: `cd /Users/doka/pg19v3admin && pnpm typecheck`
Expected: No errors related to admin-list.ts

**Step 3: Commit**

```bash
git add app/types/admin-list.ts
git commit -m "feat(types): add AdminListPage configuration types

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Компонент UiVirtualScroll

**Files:**
- Create: `app/components/ui/UiVirtualScroll.vue`

**Step 1: Создать компонент виртуализации**

```vue
<script setup lang="ts">
/**
 * UiVirtualScroll — виртуализация списков
 *
 * Рендерит только видимые элементы + overscan для плавного скролла.
 * Использует transform: translateY для позиционирования.
 */

interface Props {
  /** Массив элементов */
  items: unknown[]
  /** Высота одного элемента в пикселях */
  itemHeight: number
  /** Высота контейнера (px или CSS значение) */
  containerHeight?: number | string
  /** Сколько элементов рендерить за пределами видимой области */
  overscan?: number
  /** Ключ для идентификации элементов */
  itemKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  containerHeight: 600,
  overscan: 5,
  itemKey: 'id',
})

// Позиция скролла
const scrollTop = ref(0)
const containerRef = ref<HTMLElement | null>(null)

// Высота контейнера в пикселях
const containerHeightPx = computed(() => {
  if (typeof props.containerHeight === 'number') return props.containerHeight
  return 600 // fallback
})

// Общая высота всех элементов
const totalHeight = computed(() => props.items.length * props.itemHeight)

// Индексы видимых элементов
const visibleRange = computed(() => {
  const startIndex = Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.overscan)
  const endIndex = Math.min(
    props.items.length,
    Math.ceil((scrollTop.value + containerHeightPx.value) / props.itemHeight) + props.overscan,
  )
  return { startIndex, endIndex }
})

// Видимые элементы с индексами
const visibleItems = computed(() => {
  const { startIndex, endIndex } = visibleRange.value
  return props.items.slice(startIndex, endIndex).map((item, i) => ({
    item,
    index: startIndex + i,
  }))
})

// Смещение для первого видимого элемента
const offsetY = computed(() => visibleRange.value.startIndex * props.itemHeight)

// Обработчик скролла
function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
}

// Прокрутить к элементу
function scrollToIndex(index: number) {
  if (!containerRef.value) return
  containerRef.value.scrollTop = index * props.itemHeight
}

defineExpose({ scrollToIndex })
</script>

<template>
  <div
    ref="containerRef"
    :style="{ height: typeof containerHeight === 'number' ? `${containerHeight}px` : containerHeight }"
    class="overflow-auto"
    @scroll="handleScroll"
  >
    <!-- Spacer для общей высоты -->
    <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
      <!-- Контейнер видимых элементов -->
      <div :style="{ transform: `translateY(${offsetY}px)` }">
        <div
          v-for="{ item, index } in visibleItems"
          :key="(item as Record<string, unknown>)[itemKey] ?? index"
          :style="{ height: `${itemHeight}px` }"
        >
          <slot :item="item" :index="index" />
        </div>
      </div>
    </div>
  </div>
</template>
```

**Step 2: Проверить TypeScript**

Run: `cd /Users/doka/pg19v3admin && pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/components/ui/UiVirtualScroll.vue
git commit -m "feat(ui): add UiVirtualScroll component for list virtualization

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Компонент AdminRowActions

**Files:**
- Create: `app/components/admin/AdminRowActions.vue`

**Step 1: Создать компонент hover-действий**

```vue
<script setup lang="ts">
/**
 * AdminRowActions — действия при наведении на строку таблицы
 *
 * Поддерживает: клик, ссылка, dropdown
 */

import type { RowActionConfig, FilterOption } from '~/types/admin-list'

interface Props {
  actions: RowActionConfig[]
  row: Record<string, unknown>
}

const props = defineProps<Props>()

// Состояние открытого dropdown
const openDropdownKey = ref<string | null>(null)

// Фильтруем видимые действия
const visibleActions = computed(() => {
  return props.actions.filter((action) => {
    if (!action.visible) return true
    return action.visible(props.row)
  })
})

// Проверка типа действия
function isHrefAction(action: RowActionConfig): action is RowActionConfig & { href: (row: Record<string, unknown>) => string } {
  return 'href' in action
}

function isDropdownAction(action: RowActionConfig): action is RowActionConfig & { dropdown: { options: FilterOption[], onSelect: (row: Record<string, unknown>, value: string) => void } } {
  return 'dropdown' in action
}

// Обработка клика
function handleClick(action: RowActionConfig) {
  if (isDropdownAction(action)) {
    openDropdownKey.value = openDropdownKey.value === action.key ? null : action.key
    return
  }
  if ('action' in action && action.action) {
    action.action(props.row)
  }
}

// Обработка выбора в dropdown
async function handleDropdownSelect(action: RowActionConfig, value: string) {
  if (isDropdownAction(action)) {
    await action.dropdown.onSelect(props.row, value)
    openDropdownKey.value = null
  }
}

// Закрыть dropdown при клике вне
function closeDropdowns() {
  openDropdownKey.value = null
}

// Закрытие при клике вне
onMounted(() => {
  document.addEventListener('click', closeDropdowns)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns)
})
</script>

<template>
  <div
    class="admin-row-actions"
    @click.stop
  >
    <template v-for="action in visibleActions" :key="action.key">
      <!-- Ссылка -->
      <a
        v-if="isHrefAction(action)"
        :href="action.href(row)"
        :title="action.label"
        class="admin-row-action"
        @click.stop
      >
        <Icon :name="action.icon" class="w-4 h-4" />
      </a>

      <!-- Кнопка или Dropdown trigger -->
      <div v-else class="relative">
        <button
          :title="action.label"
          class="admin-row-action"
          @click.stop="handleClick(action)"
        >
          <Icon :name="action.icon" class="w-4 h-4" />
        </button>

        <!-- Dropdown menu -->
        <Transition name="dropdown">
          <div
            v-if="isDropdownAction(action) && openDropdownKey === action.key"
            class="admin-row-dropdown"
          >
            <button
              v-for="opt in action.dropdown.options"
              :key="opt.value"
              class="admin-row-dropdown-item"
              @click.stop="handleDropdownSelect(action, opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </Transition>
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-row-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.15s ease;
}

/* Показываем при hover на родительскую строку */
:global(tr:hover) .admin-row-actions,
.admin-row-actions:focus-within {
  opacity: 1;
}

.admin-row-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  color: var(--text-muted);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  cursor: pointer;
  transition: all 0.15s ease;
}

.admin-row-action:hover {
  color: var(--text-primary);
  background: var(--primary);
  border-color: var(--primary);
}

.admin-row-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.25rem;
  min-width: 10rem;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 0.5rem;
  padding: 0.25rem;
  z-index: 50;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.admin-row-dropdown-item {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.875rem;
  color: var(--text-secondary);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.admin-row-dropdown-item:hover {
  background: var(--primary);
  color: var(--text-primary);
}

/* Анимация dropdown */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
```

**Step 2: Проверить TypeScript**

Run: `cd /Users/doka/pg19v3admin && pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/components/admin/AdminRowActions.vue
git commit -m "feat(admin): add AdminRowActions component for hover actions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Компонент AdminListFilters

**Files:**
- Create: `app/components/admin/AdminListFilters.vue`

**Step 1: Создать компонент фильтров**

```vue
<script setup lang="ts">
/**
 * AdminListFilters — унифицированная панель фильтров
 *
 * Layout: [Поиск] [Кнопки статуса] [Доп. фильтры (select/checkbox)]
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
        variant="ghost"
        size="sm"
        @click="filterValues[filter.key] = opt.value"
      >
        {{ opt.label }}
      </UiButton>
    </div>

    <!-- Select фильтры -->
    <UiSelect
      v-for="filter in selectFilters"
      :key="filter.key"
      v-model="filterValues[filter.key]"
      :options="filter.options"
      :placeholder="filter.placeholder"
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

    <!-- Поиск (справа) -->
    <div v-if="showSearch" class="ml-auto">
      <UiInput
        v-model="searchQuery"
        :placeholder="searchPlaceholder"
        size="sm"
        class="w-64"
      >
        <template #leading>
          <Icon name="heroicons:magnifying-glass" class="w-4 h-4 text-[var(--text-muted)]" />
        </template>
      </UiInput>
    </div>
  </div>
</template>

<style scoped>
.admin-list-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-buttons {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
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
```

**Step 2: Проверить TypeScript**

Run: `cd /Users/doka/pg19v3admin && pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/components/admin/AdminListFilters.vue
git commit -m "feat(admin): add AdminListFilters component for unified filtering

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Компонент AdminListTable

**Files:**
- Create: `app/components/admin/AdminListTable.vue`

**Step 1: Создать компонент таблицы с виртуализацией**

```vue
<script setup lang="ts">
/**
 * AdminListTable — таблица с виртуализацией и hover-действиями
 *
 * Расширяет UiTable: виртуализация, форматтеры, бейджи, hover actions
 */

import type { ColumnConfig, RowActionConfig } from '~/types/admin-list'
import type { SortState } from '~/components/ui/UiTable.vue'
import { getStatusLabel, getStatusBadgeClass } from '~/composables/useStatusConfig'

interface Props {
  data: Record<string, unknown>[]
  columns: ColumnConfig[]
  rowKey?: string
  rowActions?: RowActionConfig[]
  emptyIcon?: string
  emptyText?: string
  loading?: boolean
  /** Использовать виртуализацию (для больших списков) */
  virtualize?: boolean
  /** Высота контейнера при виртуализации */
  virtualHeight?: number
  /** Высота строки при виртуализации */
  rowHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  rowActions: () => [],
  emptyIcon: 'heroicons:inbox',
  emptyText: 'Данные не найдены',
  loading: false,
  virtualize: false,
  virtualHeight: 600,
  rowHeight: 52,
})

const emit = defineEmits<{
  'row-click': [row: Record<string, unknown>]
  'update:sort': [sort: SortState]
}>()

const { formatBalance, formatDateShort, formatDateTime, formatPhone } = useFormatters()

// Форматирование значения по типу колонки
function formatValue(value: unknown, column: ColumnConfig): string {
  if (value === null || value === undefined) return '—'

  switch (column.format) {
    case 'date':
      return formatDateShort(value as string)
    case 'datetime':
      return formatDateTime(value as string)
    case 'money':
      return formatBalance(value as number)
    case 'phone':
      return formatPhone(value as string)
    default:
      return String(value)
  }
}

// Есть ли hover-действия
const hasRowActions = computed(() => props.rowActions.length > 0)

// Колонки с добавленной колонкой действий
const effectiveColumns = computed(() => {
  if (!hasRowActions.value) return props.columns
  return [
    ...props.columns,
    { key: '_actions', label: '', width: 'w-20' },
  ]
})
</script>

<template>
  <div>
    <UiLoading v-if="loading" />

    <template v-else>
      <!-- Обычная таблица (без виртуализации) -->
      <UiTable
        v-if="!virtualize"
        :data="data"
        :columns="effectiveColumns"
        :row-key="rowKey"
        :empty-icon="emptyIcon"
        :empty-text="emptyText"
        local-sort
        @row-click="row => emit('row-click', row)"
        @update:sort="sort => emit('update:sort', sort)"
      >
        <!-- Пробрасываем все слоты -->
        <template v-for="col in columns" :key="col.key" #[col.key]="{ row, value }">
          <!-- Бейдж для статусов -->
          <template v-if="col.badge">
            <UiBadge :class="getStatusBadgeClass(col.badge.config, value as string)" size="sm">
              {{ getStatusLabel(col.badge.config, value as string) }}
            </UiBadge>
          </template>

          <!-- Относительное время -->
          <template v-else-if="col.format === 'relative'">
            <span class="text-sm text-[var(--text-muted)]">
              <UiRelativeTime :date="value as string" />
            </span>
          </template>

          <!-- Форматированное значение -->
          <template v-else-if="col.format">
            <span :class="col.format === 'money' && (value as number) < 0 ? 'text-red-400' : ''">
              {{ formatValue(value, col) }}
            </span>
          </template>

          <!-- Пользовательский слот -->
          <template v-else>
            <slot :name="col.key" :row="row" :value="value">
              {{ value ?? '—' }}
            </slot>
          </template>
        </template>

        <!-- Колонка действий -->
        <template v-if="hasRowActions" #_actions="{ row }">
          <AdminRowActions :actions="rowActions" :row="row" />
        </template>
      </UiTable>

      <!-- Виртуализированная таблица -->
      <div v-else class="overflow-x-auto">
        <table class="ui-table">
          <thead>
            <tr>
              <th
                v-for="col in effectiveColumns"
                :key="col.key"
                :class="col.width"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
        </table>

        <UiVirtualScroll
          :items="data"
          :item-height="rowHeight"
          :container-height="virtualHeight"
          :item-key="rowKey"
        >
          <template #default="{ item, index }">
            <table class="ui-table">
              <tbody>
                <tr
                  class="clickable"
                  @click="emit('row-click', item as Record<string, unknown>)"
                >
                  <td
                    v-for="col in effectiveColumns"
                    :key="col.key"
                    :class="col.width"
                  >
                    <template v-if="col.key === '_actions'">
                      <AdminRowActions :actions="rowActions" :row="item as Record<string, unknown>" />
                    </template>
                    <template v-else-if="col.badge">
                      <UiBadge :class="getStatusBadgeClass(col.badge.config, (item as Record<string, unknown>)[col.key] as string)" size="sm">
                        {{ getStatusLabel(col.badge.config, (item as Record<string, unknown>)[col.key] as string) }}
                      </UiBadge>
                    </template>
                    <template v-else>
                      <slot :name="col.key" :row="item" :value="(item as Record<string, unknown>)[col.key]">
                        {{ formatValue((item as Record<string, unknown>)[col.key], col) }}
                      </slot>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </UiVirtualScroll>

        <UiEmptyState
          v-if="data.length === 0"
          :icon="emptyIcon"
          :title="emptyText"
        />
      </div>
    </template>
  </div>
</template>
```

**Step 2: Проверить TypeScript**

Run: `cd /Users/doka/pg19v3admin && pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/components/admin/AdminListTable.vue
git commit -m "feat(admin): add AdminListTable with virtualization and formatters

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Компонент AdminListPage

**Files:**
- Create: `app/components/admin/AdminListPage.vue`

**Step 1: Создать главный компонент-обёртку**

```vue
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
    } else if (filter.type === 'checkbox') {
      result[filter.key] = false
    } else {
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
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <h1 class="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
        <Icon :name="icon" class="w-8 h-8" />
        {{ title }}
        <span v-if="total > 0" class="text-lg font-normal text-[var(--text-muted)]">
          ({{ total }})
        </span>
      </h1>

      <slot name="header-actions">
        <UiButton v-if="showCreateButton" @click="goToCreate">
          <Icon name="heroicons:plus" class="w-4 h-4" />
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
```

**Step 2: Проверить TypeScript**

Run: `cd /Users/doka/pg19v3admin && pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/components/admin/AdminListPage.vue
git commit -m "feat(admin): add AdminListPage unified list component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Компоненты ячеек

**Files:**
- Create: `app/components/cells/UserCell.vue`
- Create: `app/components/cells/ContactsCell.vue`

**Step 1: Создать UserCell**

```vue
<script setup lang="ts">
/**
 * UserCell — ячейка с аватаром, именем и онлайн-статусом
 */

interface Props {
  user: {
    avatar?: string | null
    firstName?: string | null
    lastName?: string | null
    fullName?: string | null
    onlineStatus?: string
    telegram?: { username?: string } | null
  }
  showOnlineStatus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showOnlineStatus: true,
})

// Инициалы для аватара
const initials = computed(() => {
  const first = props.user.firstName?.charAt(0) || ''
  const last = props.user.lastName?.charAt(0) || ''
  return first + last || '?'
})

// Имя для отображения
const displayName = computed(() => {
  return props.user.fullName || `${props.user.firstName || ''} ${props.user.lastName || ''}`.trim() || '—'
})

// Класс онлайн-индикатора
function getOnlineStatusClass(status?: string) {
  switch (status) {
    case 'online': return 'bg-green-500'
    case 'away': return 'bg-yellow-500'
    default: return 'bg-gray-500'
  }
}
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- Avatar -->
    <div class="relative">
      <div
        v-if="user.avatar"
        :style="{ backgroundImage: `url(${user.avatar})` }"
        class="w-10 h-10 rounded-full bg-cover bg-center"
      />
      <div
        v-else
        class="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center"
      >
        <span class="text-sm font-medium text-[var(--text-primary)]">
          {{ initials }}
        </span>
      </div>
      <!-- Online indicator -->
      <div
        v-if="showOnlineStatus"
        :class="getOnlineStatusClass(user.onlineStatus)"
        class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-base)]"
      />
    </div>
    <!-- Name -->
    <div>
      <p class="font-medium text-[var(--text-primary)]">{{ displayName }}</p>
      <p v-if="user.telegram?.username" class="text-xs text-[var(--text-muted)]">
        @{{ user.telegram.username }}
      </p>
    </div>
  </div>
</template>
```

**Step 2: Создать ContactsCell**

```vue
<script setup lang="ts">
/**
 * ContactsCell — ячейка с телефоном и email
 */

interface Props {
  phone?: string | null
  email?: string | null
}

defineProps<Props>()
</script>

<template>
  <div class="text-sm">
    <p v-if="phone" class="text-[var(--text-secondary)]">{{ phone }}</p>
    <p v-if="email" class="text-[var(--text-muted)] text-xs">{{ email }}</p>
    <p v-if="!phone && !email" class="text-[var(--text-muted)]">—</p>
  </div>
</template>
```

**Step 3: Проверить TypeScript**

Run: `cd /Users/doka/pg19v3admin && pnpm typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/components/cells/
git commit -m "feat(cells): add UserCell and ContactsCell reusable components

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Миграция Users

**Files:**
- Modify: `app/pages/users/index.vue`

**Step 1: Переписать страницу Users**

```vue
<script setup lang="ts">
import type { User } from '~/types/admin'
import type { ColumnConfig, FilterConfig } from '~/types/admin-list'
import {
  USER_STATUS,
  USER_STATUS_OPTIONS,
} from '~/composables/useStatusConfig'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Пользователи — Админ-панель' })

const router = useRouter()

// Конфигурация колонок
const columns: ColumnConfig[] = [
  { key: 'user', label: 'Пользователь' },
  { key: 'contacts', label: 'Контакты' },
  { key: 'status', label: 'Статус', badge: { config: USER_STATUS } },
  { key: 'accountsCount', label: 'Аккаунты' },
  { key: 'lastSeenAt', label: 'Последний визит', sortable: true, format: 'relative' },
  { key: 'createdAt', label: 'Создан', sortable: true, format: 'relative' },
]

// Конфигурация фильтров
const filters: FilterConfig[] = [
  { key: 'status', type: 'buttons', options: USER_STATUS_OPTIONS, defaultValue: 'all' },
]

// Переход к странице пользователя
function goToUser(user: User) {
  router.push(`/users/${user.id}`)
}
</script>

<template>
  <AdminListPage
    title="Пользователи"
    icon="heroicons:users"
    endpoint="/api/admin/users"
    response-key="users"
    :columns="columns"
    :filters="filters"
    search-placeholder="Поиск по имени, телефону, email..."
    empty-icon="heroicons:users"
    empty-text="Пользователей не найдено"
    show-create-button
    create-url="/users/create"
    @row-click="goToUser"
  >
    <!-- Кастомная ячейка пользователя -->
    <template #user="{ row }">
      <UserCell :user="row" />
    </template>

    <!-- Кастомная ячейка контактов -->
    <template #contacts="{ row }">
      <ContactsCell :phone="row.phone" :email="row.email" />
    </template>

    <!-- Количество аккаунтов -->
    <template #accountsCount="{ row }">
      <span class="text-sm text-[var(--text-secondary)]">{{ row.accountsCount }}</span>
    </template>
  </AdminListPage>
</template>
```

**Step 2: Проверить что страница работает**

Run: `cd /Users/doka/pg19v3admin && pnpm dev`
Expected: Открыть http://localhost:3000/users — таблица отображается корректно

**Step 3: Commit**

```bash
git add app/pages/users/index.vue
git commit -m "refactor(users): migrate to AdminListPage component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Миграция Accounts

**Files:**
- Modify: `app/pages/accounts/index.vue`

**Step 1: Переписать страницу Accounts**

```vue
<script setup lang="ts">
import type { Account } from '~/types/admin'
import type { ColumnConfig, FilterConfig } from '~/types/admin-list'
import {
  ACCOUNT_STATUS,
  ACCOUNT_STATUS_OPTIONS,
  CONTRACT_STATUS,
  CONTRACT_STATUS_OPTIONS,
} from '~/composables/useStatusConfig'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Аккаунты — Админ-панель' })

const router = useRouter()

// Конфигурация колонок
const columns: ColumnConfig[] = [
  { key: 'contractNumber', label: 'Договор', width: 'w-32' },
  { key: 'user', label: 'Пользователь' },
  { key: 'addressFull', label: 'Адрес' },
  { key: 'balance', label: 'Баланс', sortable: true, format: 'money' },
  { key: 'status', label: 'Статус', badge: { config: ACCOUNT_STATUS } },
  { key: 'contractStatus', label: 'Договор', badge: { config: CONTRACT_STATUS } },
  { key: 'createdAt', label: 'Создан', sortable: true, format: 'date' },
]

// Конфигурация фильтров
const filters: FilterConfig[] = [
  { key: 'status', type: 'buttons', options: ACCOUNT_STATUS_OPTIONS, defaultValue: 'all' },
  { key: 'contractStatus', type: 'select', options: CONTRACT_STATUS_OPTIONS, defaultValue: 'all', placeholder: 'Статус договора' },
]

// Переход к странице аккаунта
function goToAccount(account: Account) {
  router.push(`/accounts/${account.id}`)
}
</script>

<template>
  <AdminListPage
    title="Аккаунты"
    icon="heroicons:building-office"
    endpoint="/api/admin/accounts"
    response-key="accounts"
    :columns="columns"
    :filters="filters"
    search-placeholder="Поиск по № договора или адресу..."
    empty-icon="heroicons:building-office"
    empty-text="Аккаунтов не найдено"
    @row-click="goToAccount"
  >
    <!-- Номер договора -->
    <template #contractNumber="{ row }">
      <span class="font-mono text-sm">{{ row.contractNumber }}</span>
    </template>

    <!-- Пользователь -->
    <template #user="{ row }">
      <NuxtLink
        v-if="row.user"
        :to="`/users/${row.user.id}`"
        class="text-primary hover:underline"
        @click.stop
      >
        {{ row.user.fullName }}
      </NuxtLink>
      <span v-else class="text-[var(--text-muted)]">—</span>
    </template>

    <!-- Адрес с truncate -->
    <template #addressFull="{ row }">
      <span class="text-sm text-[var(--text-secondary)] truncate max-w-xs block">
        {{ row.addressFull || '—' }}
      </span>
    </template>
  </AdminListPage>
</template>
```

**Step 2: Проверить что страница работает**

Run: Открыть http://localhost:3000/accounts
Expected: Таблица отображается корректно с двумя фильтрами

**Step 3: Commit**

```bash
git add app/pages/accounts/index.vue
git commit -m "refactor(accounts): migrate to AdminListPage component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Миграция Tickets

**Files:**
- Modify: `app/pages/tickets/index.vue`

**Step 1: Переписать страницу Tickets**

```vue
<script setup lang="ts">
import type { Ticket } from '~/types/admin'
import type { ColumnConfig, FilterConfig } from '~/types/admin-list'
import {
  TICKET_STATUS,
  TICKET_STATUS_OPTIONS,
  TICKET_PRIORITY,
  TICKET_PRIORITY_OPTIONS,
} from '~/composables/useStatusConfig'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Тикеты — Админ-панель' })

const router = useRouter()

// Конфигурация колонок
const columns: ColumnConfig[] = [
  { key: 'number', label: 'Номер', width: 'w-24' },
  { key: 'subject', label: 'Тема' },
  { key: 'status', label: 'Статус', badge: { config: TICKET_STATUS } },
  { key: 'priority', label: 'Приоритет', badge: { config: TICKET_PRIORITY } },
  { key: 'assignedAdmin', label: 'Назначен' },
  { key: 'createdAt', label: 'Создан', sortable: true, format: 'date' },
]

// Конфигурация фильтров
const filters: FilterConfig[] = [
  { key: 'status', type: 'buttons', options: TICKET_STATUS_OPTIONS, defaultValue: 'active' },
  { key: 'priority', type: 'select', options: TICKET_PRIORITY_OPTIONS, defaultValue: 'all', placeholder: 'Приоритет' },
  { key: 'assignedToMe', type: 'checkbox', label: 'Только мои', defaultValue: false },
]

// Трансформация параметров (виртуальный фильтр 'active')
function transformParams(f: Record<string, unknown>) {
  return {
    status: f.status === 'active' ? null : String(f.status),
    priority: f.priority === 'all' ? null : String(f.priority),
    assignedToMe: f.assignedToMe ? 'true' : null,
  }
}

// Переход к тикету
function goToTicket(ticket: Ticket) {
  router.push(`/tickets/${ticket.id}`)
}
</script>

<template>
  <AdminListPage
    title="Тикеты"
    icon="heroicons:ticket"
    endpoint="/api/admin/tickets"
    response-key="tickets"
    :columns="columns"
    :filters="filters"
    :transform-params="transformParams"
    search-placeholder="Поиск по номеру или теме..."
    empty-icon="heroicons:ticket"
    empty-text="Тикетов не найдено"
    @row-click="goToTicket"
  >
    <!-- Номер тикета -->
    <template #number="{ row }">
      <span class="font-mono text-sm text-primary">{{ row.number }}</span>
    </template>

    <!-- Тема + пользователь -->
    <template #subject="{ row }">
      <div>
        <p class="font-medium text-[var(--text-primary)]">{{ row.subject }}</p>
        <p v-if="row.user" class="text-xs text-[var(--text-muted)]">
          {{ row.user.fullName }} • {{ row.user.email }}
        </p>
      </div>
    </template>

    <!-- Назначенный админ -->
    <template #assignedAdmin="{ row }">
      <span class="text-sm text-[var(--text-secondary)]">
        {{ row.assignedAdmin?.fullName || '—' }}
      </span>
    </template>
  </AdminListPage>
</template>
```

**Step 2: Проверить что страница работает**

Run: Открыть http://localhost:3000/tickets
Expected: Таблица с тремя фильтрами (кнопки, select, checkbox)

**Step 3: Commit**

```bash
git add app/pages/tickets/index.vue
git commit -m "refactor(tickets): migrate to AdminListPage with transformParams

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Страница Requests Connection

**Files:**
- Create: `app/pages/requests/connection/index.vue`

**Step 1: Создать страницу заявок на подключение**

```vue
<script setup lang="ts">
import type { ColumnConfig, FilterConfig } from '~/types/admin-list'
import {
  CONNECTION_REQUEST_STATUS,
  CONNECTION_REQUEST_STATUS_OPTIONS,
} from '~/composables/useStatusConfig'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Заявки на подключение — Админ-панель' })

const router = useRouter()

// Конфигурация колонок
const columns: ColumnConfig[] = [
  { key: 'user', label: 'Заявитель' },
  { key: 'address', label: 'Адрес' },
  { key: 'status', label: 'Статус', badge: { config: CONNECTION_REQUEST_STATUS } },
  { key: 'inCoverageZone', label: 'Зона покрытия' },
  { key: 'source', label: 'Источник' },
  { key: 'createdAt', label: 'Создана', sortable: true, format: 'relative' },
]

// Конфигурация фильтров
const filters: FilterConfig[] = [
  { key: 'status', type: 'buttons', options: CONNECTION_REQUEST_STATUS_OPTIONS, defaultValue: 'all' },
  { key: 'inCoverageZone', type: 'checkbox', label: 'В зоне покрытия', defaultValue: false },
]

// Переход к заявке
function goToRequest(request: Record<string, unknown>) {
  router.push(`/requests/connection/${request.id}`)
}
</script>

<template>
  <AdminListPage
    title="Заявки на подключение"
    icon="heroicons:signal"
    endpoint="/api/admin/requests/connection"
    response-key="requests"
    :columns="columns"
    :filters="filters"
    search-placeholder="Поиск по имени или адресу..."
    empty-icon="heroicons:signal"
    empty-text="Заявок не найдено"
    @row-click="goToRequest"
  >
    <!-- Заявитель -->
    <template #user="{ row }">
      <div>
        <p class="font-medium text-[var(--text-primary)]">{{ row.name }}</p>
        <p class="text-xs text-[var(--text-muted)]">{{ row.phone }}</p>
      </div>
    </template>

    <!-- Адрес -->
    <template #address="{ row }">
      <span class="text-sm text-[var(--text-secondary)] truncate max-w-xs block">
        {{ row.address || '—' }}
      </span>
    </template>

    <!-- Зона покрытия -->
    <template #inCoverageZone="{ row }">
      <UiBadge
        :class="row.inCoverageZone ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'"
        size="sm"
      >
        {{ row.inCoverageZone ? 'Да' : 'Нет' }}
      </UiBadge>
    </template>

    <!-- Источник -->
    <template #source="{ row }">
      <span class="text-sm text-[var(--text-muted)]">{{ row.source || '—' }}</span>
    </template>
  </AdminListPage>
</template>
```

**Step 2: Проверить что страница работает**

Run: Открыть http://localhost:3000/requests/connection
Expected: Таблица заявок на подключение

**Step 3: Commit**

```bash
git add app/pages/requests/connection/index.vue
git commit -m "feat(requests): add connection requests page with AdminListPage

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Страница Requests Callback

**Files:**
- Create: `app/pages/requests/callback/index.vue`

**Step 1: Создать страницу заявок на обратный звонок с hover-действиями**

```vue
<script setup lang="ts">
import type { ColumnConfig, FilterConfig, RowActionConfig } from '~/types/admin-list'
import {
  CALLBACK_REQUEST_STATUS,
  CALLBACK_REQUEST_STATUS_OPTIONS,
} from '~/composables/useStatusConfig'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Обратный звонок — Админ-панель' })

const toast = useToast()

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
  { key: 'status', type: 'buttons', options: CALLBACK_REQUEST_STATUS_OPTIONS, defaultValue: 'all' },
]

// Обновление статуса заявки
async function updateStatus(id: string, status: string) {
  try {
    await $fetch(`/api/admin/requests/callback/${id}`, {
      method: 'PATCH',
      body: { status },
    })
    toast.success('Статус обновлён')
    // Перезагрузка списка произойдёт автоматически через AdminListPage
  } catch {
    toast.error('Ошибка обновления статуса')
  }
}

// Hover-действия
const rowActions: RowActionConfig[] = [
  {
    key: 'call',
    icon: 'heroicons:phone',
    label: 'Позвонить',
    visible: (row) => !!row.phone,
    href: (row) => `tel:${row.phone}`,
  },
  {
    key: 'status',
    icon: 'heroicons:arrow-path',
    label: 'Сменить статус',
    dropdown: {
      options: CALLBACK_REQUEST_STATUS_OPTIONS.filter(o => o.value !== 'all'),
      onSelect: (row, value) => updateStatus(row.id as string, value),
    },
  },
]
</script>

<template>
  <AdminListPage
    title="Обратный звонок"
    icon="heroicons:phone-arrow-up-right"
    endpoint="/api/admin/requests/callback"
    response-key="requests"
    :columns="columns"
    :filters="filters"
    :row-actions="rowActions"
    search-placeholder="Поиск по имени или телефону..."
    empty-icon="heroicons:phone-arrow-up-right"
    empty-text="Заявок не найдено"
  >
    <!-- Имя -->
    <template #name="{ row }">
      <span class="font-medium text-[var(--text-primary)]">{{ row.name }}</span>
    </template>

    <!-- Источник -->
    <template #source="{ row }">
      <span class="text-sm text-[var(--text-muted)]">{{ row.source || '—' }}</span>
    </template>

    <!-- Обработал -->
    <template #processedBy="{ row }">
      <span class="text-sm text-[var(--text-secondary)]">
        {{ row.processedBy?.fullName || '—' }}
      </span>
    </template>
  </AdminListPage>
</template>
```

**Step 2: Проверить что страница работает**

Run: Открыть http://localhost:3000/requests/callback
Expected: Таблица с hover-действиями (иконки появляются при наведении на строку)

**Step 3: Commit**

```bash
git add app/pages/requests/callback/index.vue
git commit -m "feat(requests): add callback requests page with hover actions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Редирект Requests

**Files:**
- Modify: `app/pages/requests/index.vue`

**Step 1: Заменить на редирект**

```vue
<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

// Редирект на страницу заявок на подключение
navigateTo('/requests/connection', { replace: true })
</script>

<template>
  <div />
</template>
```

**Step 2: Проверить редирект**

Run: Открыть http://localhost:3000/requests
Expected: Автоматический переход на /requests/connection

**Step 3: Commit**

```bash
git add app/pages/requests/index.vue
git commit -m "refactor(requests): redirect /requests to /requests/connection

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Финальная проверка

**Step 1: Запустить typecheck**

Run: `cd /Users/doka/pg19v3admin && pnpm typecheck`
Expected: No errors

**Step 2: Запустить lint**

Run: `cd /Users/doka/pg19v3admin && pnpm lint`
Expected: No errors

**Step 3: Проверить все страницы вручную**

- [ ] /users — таблица с фильтрами и поиском
- [ ] /accounts — таблица с двумя фильтрами
- [ ] /tickets — таблица с тремя фильтрами (включая checkbox)
- [ ] /requests — редирект на /requests/connection
- [ ] /requests/connection — таблица заявок
- [ ] /requests/callback — таблица с hover-действиями

**Step 4: Финальный коммит (если были правки)**

```bash
git add -A
git commit -m "chore: final cleanup after table unification

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Архитектурные заметки

### Что получилось

1. **Один компонент AdminListPage** заменяет ~80 строк кода на каждой странице → ~30 строк конфигурации
2. **Унифицированный UI** — одинаковый layout фильтров, поиска, таблицы на всех страницах
3. **Hover-действия** — не загромождают таблицу, появляются только при необходимости
4. **Виртуализация готова** — включается одним prop `virtualize` когда понадобится
5. **Переиспользуемые ячейки** — UserCell, ContactsCell можно использовать везде

### Что можно улучшить позже

- Добавить серверную пагинацию в useAdminList
- Добавить экспорт в CSV/Excel
- Добавить bulk actions (массовые действия)
- Добавить сохранение фильтров в URL query params
