<script setup lang="ts">
/**
 * UiTable — унифицированный компонент таблицы
 *
 * Использует CSS класс .ui-table для стилей
 * Поддерживает slots для кастомного рендеринга ячеек
 * Поддерживает сортировку через v-model:sort
 */

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  class?: string
  headerClass?: string
}

export interface SortState {
  key: string | null
  direction: 'asc' | 'desc'
}

interface Props {
  data: any[]
  columns: TableColumn[]
  rowKey?: string
  clickable?: boolean
  loading?: boolean
  emptyIcon?: string
  emptyText?: string
  sort?: SortState
  localSort?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  clickable: true,
  loading: false,
  emptyIcon: 'heroicons:inbox',
  emptyText: 'Данные не найдены',
  localSort: false,
})

const emit = defineEmits<{
  'row-click': [row: any]
  'update:sort': [sort: SortState]
}>()

// Internal sort state for localSort mode
const internalSort = ref<SortState>({ key: null, direction: 'desc' })

const currentSort = computed(() => props.sort ?? internalSort.value)

const handleSort = (column: TableColumn) => {
  if (!column.sortable) return

  const newSort: SortState = {
    key: column.key,
    direction: currentSort.value.key === column.key && currentSort.value.direction === 'asc'
      ? 'desc'
      : 'asc',
  }

  if (props.localSort) {
    internalSort.value = newSort
  }

  emit('update:sort', newSort)
}

// Sort data locally if localSort is enabled
const sortedData = computed(() => {
  if (!props.localSort || !currentSort.value.key) {
    return props.data
  }

  const key = currentSort.value.key
  const dir = currentSort.value.direction === 'asc' ? 1 : -1

  return [...props.data].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]

    if (aVal == null) return 1
    if (bVal == null) return -1
    if (aVal < bVal) return -1 * dir
    if (aVal > bVal) return 1 * dir
    return 0
  })
})

const handleRowClick = (row: any) => {
  emit('row-click', row)
}

const getSortIcon = (column: TableColumn) => {
  if (!column.sortable) return null
  if (currentSort.value.key !== column.key) return 'heroicons:chevron-up-down'
  return currentSort.value.direction === 'asc'
    ? 'heroicons:chevron-up'
    : 'heroicons:chevron-down'
}
</script>

<template>
  <div>
    <!-- Loading -->
    <UiLoading v-if="loading" />

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="ui-table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="[
                col.headerClass,
                col.sortable && 'sortable',
              ]"
              @click="handleSort(col)"
            >
              <span class="inline-flex items-center gap-1">
                {{ col.label }}
                <Icon
                  v-if="getSortIcon(col)"
                  :name="getSortIcon(col)!"
                  class="w-4 h-4"
                  :class="currentSort.key === col.key ? 'text-primary' : 'opacity-50'"
                />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in sortedData"
            :key="row[rowKey]"
            :class="clickable && 'clickable'"
            @click="clickable && handleRowClick(row)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="col.class"
            >
              <slot :name="col.key" :row="row" :value="row[col.key]">
                {{ row[col.key] ?? '—' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <UiEmptyState
        v-if="sortedData.length === 0"
        :icon="emptyIcon"
        :title="emptyText"
      />
    </div>
  </div>
</template>
