<script setup lang="ts">
import type { Account } from '~/types/admin'
import type { ColumnConfig } from '~/types/admin-list'
import {
  ACCOUNT_STATUS_OPTIONS,
  CONTRACT_STATUS,
  CONTRACT_STATUS_OPTIONS,
} from '~/composables/useStatusConfig'
import { useAdminList } from '~/composables/useAdminList'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Договоры — Админ-панель' })

const router = useRouter()

// Конфигурация колонок
const columns: ColumnConfig[] = [
  { key: 'contractNumber', label: '№', width: 'w-24' },
  { key: 'user', label: 'Клиент', width: 'w-56' },
  { key: 'addressFull', label: 'Адрес' },
  { key: 'balance', label: 'Баланс', sortable: true, format: 'money' },
  { key: 'contractStatus', label: 'Статус', badge: { config: CONTRACT_STATUS } },
  { key: 'createdAt', label: 'Создан', sortable: true, format: 'date' },
]

// Используем composable для списка
const {
  items,
  loading,
  total,
  filters,
  searchQuery,
  onSearchInput,
} = useAdminList<Account, { status: string, contractStatus: string }>({
  endpoint: '/api/admin/accounts',
  responseKey: 'accounts',
  initialFilters: {
    status: 'all',
    contractStatus: 'all',
  },
})

// Состояние выпадающих меню фильтров
const statusDropdownOpen = ref(false)
const contractDropdownOpen = ref(false)

// Опции для фильтров
const statusAccountOptions = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'blocked', label: 'Заблокированы' },
  { value: 'closed', label: 'Закрыты' },
]

const statusContractOptions = [
  { value: 'all', label: 'Все' },
  { value: 'draft', label: 'Черновик' },
  { value: 'active', label: 'Активный' },
  { value: 'terminated', label: 'Расторгнут' },
  { value: 'stopped', label: 'Приостановлен' },
]

// Получить выбранную категорию для отображения в выпадающем списке
const selectedStatusLabel = computed(() => {
  if (filters.value.status !== 'all') {
    return statusAccountOptions.find(o => o.value === filters.value.status)?.label
  }
  return null
})

const selectedContractLabel = computed(() => {
  if (filters.value.contractStatus !== 'all') {
    return statusContractOptions.find(o => o.value === filters.value.contractStatus)?.label
  }
  return null
})

// Переключение выпадающих меню
function toggleStatusDropdown() {
  statusDropdownOpen.value = !statusDropdownOpen.value
  contractDropdownOpen.value = false
}

function toggleContractDropdown() {
  contractDropdownOpen.value = !contractDropdownOpen.value
  statusDropdownOpen.value = false
}

// Закрытие при клике вне
function closeFilterDropdowns(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.filter-dropdown-container')) {
    statusDropdownOpen.value = false
    contractDropdownOpen.value = false
  }
}

// Обработка выбора фильтра
function selectFilter(type: 'status' | 'contractStatus', value: string) {
  if (type === 'status') {
    filters.value.status = value
    statusDropdownOpen.value = false
  } else {
    filters.value.contractStatus = value
    contractDropdownOpen.value = false
  }
}

// Переход к странице аккаунта
function goToAccount(account: Account) {
  router.push(`/accounts/${account.id}`)
}

// Закрытие dropdown при клике вне
onMounted(() => {
  document.addEventListener('click', closeFilterDropdowns)
})

onUnmounted(() => {
  document.removeEventListener('click', closeFilterDropdowns)
})
</script>

<template>
  <div>
    <!-- Header с поиском и кнопкой -->
    <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
      <h1 class="flex items-center gap-3 text-3xl font-bold text-[var(--text-primary)] whitespace-nowrap flex-shrink-0">
        <Icon name="heroicons:document-text" class="h-8 w-8" />
        Договоры
        <span v-if="total > 0" class="text-lg font-normal text-[var(--text-muted)]">
          ({{ total }})
        </span>
      </h1>
      
      <UiInput
        v-model="searchQuery"
        placeholder="Поиск по № договора, ФИО или адресу..."
        @input="onSearchInput"
        class="flex-1 min-w-0 max-w-md"
      >
        <template #prefix>
          <Icon name="heroicons:magnifying-glass" class="w-4 h-4" />
        </template>
      </UiInput>
      
      <!-- Группа фильтров в ряд -->
      <div class="flex items-center gap-2 flex-1 justify-end">
        <!-- Кнопка фильтра "Статус" -->
        <div class="relative filter-dropdown-container">
          <UiButton
            @click.stop="toggleStatusDropdown"
            variant="ghost"
            :class="[
              'whitespace-nowrap min-w-[100px] justify-between',
              filters.status !== 'all' && 'bg-primary/10 text-primary',
            ]"
          >
            <span>Статус</span>
            <Icon
              name="heroicons:chevron-down"
              :class="[
                'w-4 h-4 transition-transform duration-200',
                statusDropdownOpen && 'rotate-180',
              ]"
            />
          </UiButton>

          <!-- Выпадающий список "Статус" -->
          <Transition name="dropdown">
            <div
              v-if="statusDropdownOpen"
              class="absolute right-0 top-full mt-2 w-52 glass-card rounded-xl p-2 z-50 shadow-lg border border-[var(--glass-border)]"
            >
              <!-- Выбранная категория с галочкой -->
              <div
                v-if="selectedStatusLabel"
                class="mb-2 pb-2 border-b border-[var(--glass-border)] flex items-center gap-2 text-sm text-primary font-medium px-2"
              >
                <Icon name="heroicons:check-circle" class="h-4 w-4 flex-shrink-0" />
                <span>{{ selectedStatusLabel }}</span>
              </div>
              
              <div class="space-y-0.5">
                <button
                  v-for="option in statusAccountOptions"
                  :key="option.value"
                  @click="selectFilter('status', option.value)"
                  :class="[
                    'w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    filters.status === option.value
                      ? 'bg-primary/20 text-primary font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)]',
                  ]"
                >
                  <Icon
                    v-if="filters.status === option.value"
                    name="heroicons:check-circle"
                    class="h-4 w-4 flex-shrink-0 text-primary"
                  />
                  <span v-else class="w-4"></span>
                  <span>{{ option.label }}</span>
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Кнопка фильтра "Договор" -->
        <div class="relative filter-dropdown-container">
          <UiButton
            @click.stop="toggleContractDropdown"
            variant="ghost"
            :class="[
              'whitespace-nowrap min-w-[100px] justify-between',
              filters.contractStatus !== 'all' && 'bg-primary/10 text-primary',
            ]"
          >
            <span>Договор</span>
            <Icon
              name="heroicons:chevron-down"
              :class="[
                'w-4 h-4 transition-transform duration-200',
                contractDropdownOpen && 'rotate-180',
              ]"
            />
          </UiButton>

          <!-- Выпадающий список "Договор" -->
          <Transition name="dropdown">
            <div
              v-if="contractDropdownOpen"
              class="absolute right-0 top-full mt-2 w-52 glass-card rounded-xl p-2 z-50 shadow-lg border border-[var(--glass-border)]"
            >
              <!-- Выбранная категория с галочкой -->
              <div
                v-if="selectedContractLabel"
                class="mb-2 pb-2 border-b border-[var(--glass-border)] flex items-center gap-2 text-sm text-primary font-medium px-2"
              >
                <Icon name="heroicons:check-circle" class="h-4 w-4 flex-shrink-0" />
                <span>{{ selectedContractLabel }}</span>
              </div>
              
              <div class="space-y-0.5">
                <button
                  v-for="option in statusContractOptions"
                  :key="option.value"
                  @click="selectFilter('contractStatus', option.value)"
                  :class="[
                    'w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    filters.contractStatus === option.value
                      ? 'bg-primary/20 text-primary font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)]',
                  ]"
                >
                  <Icon
                    v-if="filters.contractStatus === option.value"
                    name="heroicons:check-circle"
                    class="h-4 w-4 flex-shrink-0 text-primary"
                  />
                  <span v-else class="w-4"></span>
                  <span>{{ option.label }}</span>
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Кнопка "Создать" -->
        <UiButton @click="router.push('/accounts/create')" class="flex-shrink-0">
          <Icon name="heroicons:plus" class="h-4 w-4" />
          Создать
        </UiButton>
      </div>
    </div>

    <!-- Основной контент с боковой панелью справа -->
    <div class="flex gap-6">
      <!-- Таблица (основной контент) -->
      <div class="flex-1 min-w-0">
        <AdminListTable
          :data="items as unknown as Record<string, unknown>[]"
          :columns="columns"
          row-key="id"
          :empty-icon="'heroicons:document-text'"
          :empty-text="'Договоров не найдено'"
          :loading="loading"
          @row-click="(row) => goToAccount(row as unknown as Account)"
        >
          <!-- Номер договора -->
          <template #contractNumber="{ row }">
            <span class="font-mono text-sm text-[var(--text-secondary)]">{{ (row as Account).contractNumber || '—' }}</span>
          </template>

          <!-- Пользователь -->
          <template #user="{ row }">
            <NuxtLink
              v-if="(row as Account).user"
              :to="`/users/${(row as Account).user!.id}`"
              @click.stop
              class="font-medium text-[var(--text-primary)] hover:text-primary"
            >
              {{ (row as Account).user!.fullName }}
            </NuxtLink>
            <span v-else class="text-[var(--text-muted)]">—</span>
          </template>

          <!-- Адрес с truncate -->
          <template #addressFull="{ row }">
            <span class="block max-w-xs truncate text-sm text-[var(--text-muted)]">
              {{ (row as Account).addressFull || '—' }}
            </span>
          </template>
        </AdminListTable>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Анимация выпадающего меню */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
