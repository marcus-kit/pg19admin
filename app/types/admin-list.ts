// app/types/admin-list.ts

import type { StatusConfig, FilterOption } from '~/types/admin'

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
    config: Record<string, StatusConfig>
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

export type RowActionConfig<T = Record<string, unknown>>
  = | ClickRowAction<T>
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
