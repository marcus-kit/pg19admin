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
    :columns="columns"
    :filters="filters"
    @row-click="goToAccount"
    title="Аккаунты"
    icon="heroicons:building-office"
    endpoint="/api/admin/accounts"
    response-key="accounts"
    search-placeholder="Поиск по № договора или адресу..."
    empty-icon="heroicons:building-office"
    empty-text="Аккаунтов не найдено"
    create-url="/accounts/create"
    show-create-button
  >
    <!-- Номер договора -->
    <template #contractNumber="{ row }">
      <span class="font-mono text-sm text-[var(--text-secondary)]">{{ row.contractNumber || '—' }}</span>
    </template>

    <!-- Пользователь -->
    <template #user="{ row }">
      <NuxtLink
        v-if="row.user"
        :to="`/users/${row.user.id}`"
        @click.stop
        class="font-medium text-[var(--text-primary)] hover:text-primary"
      >
        {{ row.user.fullName }}
      </NuxtLink>
      <span v-else class="text-[var(--text-muted)]">—</span>
    </template>

    <!-- Адрес с truncate -->
    <template #addressFull="{ row }">
      <span class="block max-w-xs truncate text-sm text-[var(--text-muted)]">
        {{ row.addressFull || '—' }}
      </span>
    </template>
  </AdminListPage>
</template>
