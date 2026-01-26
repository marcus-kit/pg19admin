<script setup lang="ts">
import type { Account } from '~/types/admin'
import {
  ACCOUNT_STATUS,
  ACCOUNT_STATUS_OPTIONS,
  CONTRACT_STATUS,
  CONTRACT_STATUS_OPTIONS,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'
import { useAdminList } from '~/composables/useAdminList'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Аккаунты — Админ-панель' })

const router = useRouter()

// Use centralized list composable with two filters
const {
  items: accounts,
  loading,
  total,
  filters,
  searchQuery,
  onSearchInput,
} = useAdminList<Account, { status: string, contractStatus: string }>({
  endpoint: '/api/admin/accounts',
  responseKey: 'accounts',
  initialFilters: { status: 'all', contractStatus: 'all' },
})

const { formatBalance, formatDateShort } = useFormatters()

const columns = [
  { key: 'contractNumber', label: 'Договор' },
  { key: 'user', label: 'Пользователь' },
  { key: 'addressFull', label: 'Адрес' },
  { key: 'balance', label: 'Баланс', sortable: true },
  { key: 'status', label: 'Статус' },
  { key: 'contractStatus', label: 'Договор' },
  { key: 'createdAt', label: 'Создан', sortable: true },
]

const goToAccount = (account: Account) => {
  router.push(`/accounts/${account.id}`)
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <h1 class="text-3xl font-bold text-[var(--text-primary)]">
        Аккаунты
        <span v-if="total > 0" class="text-lg font-normal text-[var(--text-muted)]">
          ({{ total }})
        </span>
      </h1>
      <UiButton

        @click="router.push('/accounts/create')"
      >
        <Icon name="heroicons:plus" class="w-4 h-4" />
        Создать
      </UiButton>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <!-- Status Filter -->
      <div class="flex gap-1 flex-wrap">
        <UiButton
          v-for="opt in ACCOUNT_STATUS_OPTIONS"
          :key="opt.value"
          :class="{ 'bg-primary/20': filters.status === opt.value }"
          variant="ghost"
          size="sm"
          @click="filters.status = opt.value"
        >
          {{ opt.label }}
        </UiButton>
      </div>

      <div class="flex items-center gap-4 ml-auto">
        <!-- Contract Status Filter -->
        <UiSelect
          v-model="filters.contractStatus"
          :options="CONTRACT_STATUS_OPTIONS"
          :placeholder="undefined"
          size="sm"
        />

        <!-- Search -->
        <UiInput
          v-model="searchQuery"
          placeholder="Поиск по № договора или адресу..."
          size="sm"
          class="w-64"
          @input="onSearchInput"
        >
          <template #leading>
            <Icon name="heroicons:magnifying-glass" class="w-4 h-4 text-[var(--text-muted)]" />
          </template>
        </UiInput>
      </div>
    </div>

    <!-- Loading -->
    <UiLoading v-if="loading" />

    <!-- Accounts Table -->
    <UiTable
      v-else
      :data="accounts"
      :columns="columns"
      empty-icon="heroicons:identification"
      empty-text="Аккаунтов не найдено"
      @row-click="goToAccount"
    >
      <template #contractNumber="{ row }">
        <span class="font-mono text-primary">{{ row.contractNumber || '—' }}</span>
      </template>

      <template #user="{ row }">
        <template v-if="row.user">
          <span
            class="text-[var(--text-primary)] hover:text-primary cursor-pointer"
            @click.stop="router.push(`/users/${row.user.id}`)"
          >
            {{ row.user.fullName }}
          </span>
        </template>
        <template v-else>
          <span class="text-[var(--text-muted)]">—</span>
        </template>
      </template>

      <template #addressFull="{ row }">
        <span class="text-[var(--text-secondary)] max-w-xs truncate block">
          {{ row.addressFull || '—' }}
        </span>
      </template>

      <template #balance="{ row }">
        <span :class="row.balance >= 0 ? 'text-green-400' : 'text-red-400'">
          {{ formatBalance(row.balance) }}
        </span>
      </template>

      <template #status="{ row }">
        <UiBadge :class="getStatusBadgeClass(ACCOUNT_STATUS, row.status)" size="sm">
          {{ getStatusLabel(ACCOUNT_STATUS, row.status) }}
        </UiBadge>
      </template>

      <template #contractStatus="{ row }">
        <UiBadge :class="getStatusBadgeClass(CONTRACT_STATUS, row.contractStatus)" size="sm">
          {{ getStatusLabel(CONTRACT_STATUS, row.contractStatus) }}
        </UiBadge>
      </template>

      <template #createdAt="{ row }">
        <span class="text-sm text-[var(--text-muted)]">{{ formatDateShort(row.createdAt) }}</span>
      </template>
    </UiTable>
  </div>
</template>
