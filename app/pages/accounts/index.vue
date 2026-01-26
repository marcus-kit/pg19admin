<script setup lang="ts">
import type { Account } from '~/types/admin'
import type { ColumnConfig, FilterConfig } from '~/types/admin-list'
import {
  ACCOUNT_STATUS_OPTIONS,
  CONTRACT_STATUS,
  CONTRACT_STATUS_OPTIONS,
} from '~/composables/useStatusConfig'

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

// Конфигурация фильтров
const filters: FilterConfig[] = [
  { key: 'status', type: 'buttons', options: ACCOUNT_STATUS_OPTIONS, defaultValue: 'all' },
  { key: 'contractStatus', type: 'buttons', options: CONTRACT_STATUS_OPTIONS, defaultValue: 'all' },
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
    title="Договоры"
    icon="heroicons:document-text"
    endpoint="/api/admin/accounts"
    response-key="accounts"
    search-placeholder="Поиск по № договора, ФИО или адресу..."
    empty-icon="heroicons:document-text"
    empty-text="Договоров не найдено"
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
