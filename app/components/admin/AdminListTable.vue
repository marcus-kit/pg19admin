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
        @row-click="row => emit('row-click', row)"
        @update:sort="sort => emit('update:sort', sort)"
        local-sort
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
          <template #default="{ item }">
            <table class="ui-table">
              <tbody>
                <tr
                  @click="emit('row-click', item as Record<string, unknown>)"
                  class="clickable"
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
                      <UiBadge
                        :class="getStatusBadgeClass(col.badge.config, (item as Record<string, unknown>)[col.key] as string)"
                        size="sm"
                      >
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
