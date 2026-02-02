<script setup lang="ts">
import type { Ticket } from '~/types/admin'
import type { ColumnConfig } from '~/types/admin-list'
import {
  TICKET_STATUS,
  TICKET_STATUS_OPTIONS,
  TICKET_PRIORITY,
  TICKET_PRIORITY_OPTIONS,
} from '~/composables/useStatusConfig'
import { useAdminList } from '~/composables/useAdminList'

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

// Интерфейс фильтров
interface TicketFilters extends Record<string, unknown> {
  status: string
  priority: string
  assignedToMe: boolean
}

// Трансформация параметров (виртуальный фильтр 'active')
function transformParams(f: TicketFilters) {
  return {
    status: f.status === 'active' ? null : String(f.status),
    priority: f.priority === 'all' ? null : String(f.priority),
    assignedToMe: f.assignedToMe ? 'true' : null,
  }
}

// Используем composable для списка
const {
  items,
  loading,
  total,
  filters: filterValues,
  searchQuery,
  onSearchInput,
  fetchItems,
} = useAdminList<Ticket, TicketFilters>({
  endpoint: '/api/admin/tickets',
  responseKey: 'tickets',
  initialFilters: {
    status: 'active',
    priority: 'all',
    assignedToMe: false,
  },
  transformParams,
})

// Состояние для панели фильтров
const filtersExpanded = ref(true)

// Переход к тикету
function goToTicket(ticket: Ticket) {
  router.push(`/tickets/${ticket.id}`)
}

// Обработка клика по строке
function handleRowClick(row: Record<string, unknown>) {
  goToTicket(row as Ticket)
}

// Сброс фильтров
function resetFilters() {
  filterValues.value.status = 'active'
  filterValues.value.priority = 'all'
  filterValues.value.assignedToMe = false
  fetchItems()
}

// Проверка активных фильтров
const hasActiveFilters = computed(() => {
  return (
    filterValues.value.status !== 'active' ||
    filterValues.value.priority !== 'all' ||
    filterValues.value.assignedToMe === true
  )
})

// Watch для обновления списка при изменении фильтров
watch(filterValues, () => {
  fetchItems()
}, { deep: true })
</script>

<template>
  <div class="flex gap-6">
    <!-- Левая колонка: Заголовок, поиск и таблица -->
    <div class="flex-1 min-w-0">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-4 mb-4">
          <h1 class="flex items-center gap-3 text-3xl font-bold text-[var(--text-primary)] whitespace-nowrap flex-shrink-0">
            <Icon name="heroicons:ticket" class="h-8 w-8" />
            Тикеты
            <span v-if="total > 0" class="text-lg font-normal text-[var(--text-muted)]">
              ({{ total }})
            </span>
          </h1>

          <UiInput
            v-model="searchQuery"
            placeholder="Поиск по номеру или теме..."
            @input="onSearchInput"
            class="flex-1 min-w-0"
          >
            <template #prefix>
              <Icon name="heroicons:magnifying-glass" class="w-4 h-4" />
            </template>
          </UiInput>
        </div>
      </div>

      <!-- Table -->
      <div class="relative min-h-[400px]">
        <div :class="{ 'opacity-50 pointer-events-none': loading }">
          <AdminListTable
            :data="items"
            :columns="columns"
            :row-key="'id'"
            :empty-icon="'heroicons:ticket'"
            :empty-text="'Тикетов не найдено'"
            :loading="false"
            @row-click="handleRowClick"
          >
            <!-- Номер тикета -->
            <template #number="{ row }">
              <span class="font-mono text-sm text-[var(--text-secondary)]">{{ (row as Ticket).number }}</span>
            </template>

            <!-- Тема + пользователь -->
            <template #subject="{ row }">
              <div class="max-w-md">
                <p class="truncate font-medium text-[var(--text-primary)]">{{ (row as Ticket).subject }}</p>
                <p class="text-xs text-[var(--text-muted)]">
                  {{ (row as Ticket).userName || `Пользователь #${(row as Ticket).userId}` }}
                  <span v-if="(row as Ticket).userEmail" class="ml-1">· {{ (row as Ticket).userEmail }}</span>
                </p>
              </div>
            </template>

            <!-- Назначенный админ -->
            <template #assignedAdmin="{ row }">
              <span class="text-sm text-[var(--text-muted)]">
                {{ ((row as Ticket).assignedAdmin as { fullName?: string })?.fullName || '—' }}
              </span>
            </template>
          </AdminListTable>
        </div>
        <UiLoading v-if="loading" class="absolute inset-0" />
      </div>
    </div>

    <!-- Правая колонка: Панель фильтров -->
    <aside class="hidden lg:block w-72 flex-shrink-0">
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
              <div class="flex flex-col gap-1">
                <UiButton
                  v-for="opt in TICKET_STATUS_OPTIONS"
                  :key="opt.value"
                  :variant="filterValues.status === opt.value ? 'primary' : 'ghost'"
                  :class="[
                    'filter-tab-button w-full',
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

            <!-- Приоритет -->
            <div>
              <label class="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wide">
                Приоритет
              </label>
              <div class="flex flex-col gap-1">
                <UiButton
                  v-for="opt in TICKET_PRIORITY_OPTIONS"
                  :key="opt.value"
                  :variant="filterValues.priority === opt.value ? 'primary' : 'ghost'"
                  :class="[
                    'filter-tab-button w-full',
                    filterValues.priority === opt.value
                      ? 'bg-primary/20 text-primary font-medium scale-[1.02]'
                      : 'hover:bg-[var(--glass-bg)]'
                  ]"
                  size="sm"
                  @click="filterValues.priority = opt.value"
                >
                  <Icon
                    v-if="filterValues.priority === opt.value"
                    name="heroicons:check"
                    class="w-4 h-4 flex-shrink-0 text-primary"
                  />
                  <span v-else class="w-4"></span>
                  <span class="text-left">{{ opt.label }}</span>
                </UiButton>
              </div>
            </div>

            <!-- Только мои -->
            <div>
              <label
                for="assignedToMe"
                class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[var(--glass-bg)] transition-colors"
              >
                <input
                  id="assignedToMe"
                  v-model="filterValues.assignedToMe"
                  type="checkbox"
                  class="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary cursor-pointer"
                />
                <span class="text-sm font-medium text-[var(--text-primary)]">Только мои</span>
              </label>
            </div>
          </div>
        </Transition>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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

:deep(.filter-tab-button) {
  justify-content: flex-start !important;
  text-align: left;
}
</style>