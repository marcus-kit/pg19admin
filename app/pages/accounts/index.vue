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
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-[var(--glass-border)]">
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Договор</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Пользователь</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Адрес</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Баланс</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Статус</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Договор</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Создан</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="account in accounts"
            :key="account.id"
            class="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] cursor-pointer transition-colors"
            @click="router.push(`/accounts/${account.id}`)"
          >
            <td class="py-3 px-4">
              <span class="font-mono text-primary">{{ account.contractNumber || '—' }}</span>
            </td>
            <td class="py-3 px-4">
              <template v-if="account.user">
                <span
                  class="text-[var(--text-primary)] hover:text-primary"
                  @click.stop="router.push(`/users/${account.user.id}`)"
                >
                  {{ account.user.fullName }}
                </span>
              </template>
              <template v-else>
                <span class="text-[var(--text-muted)]">—</span>
              </template>
            </td>
            <td class="py-3 px-4">
              <span class="text-[var(--text-secondary)] max-w-xs truncate block">
                {{ account.addressFull || '—' }}
              </span>
            </td>
            <td class="py-3 px-4">
              <span :class="account.balance >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ formatBalance(account.balance) }}
              </span>
            </td>
            <td class="py-3 px-4">
              <UiBadge :class="getStatusBadgeClass(ACCOUNT_STATUS, account.status)" size="sm">
                {{ getStatusLabel(ACCOUNT_STATUS, account.status) }}
              </UiBadge>
            </td>
            <td class="py-3 px-4">
              <UiBadge :class="getStatusBadgeClass(CONTRACT_STATUS, account.contractStatus)" size="sm">
                {{ getStatusLabel(CONTRACT_STATUS, account.contractStatus) }}
              </UiBadge>
            </td>
            <td class="py-3 px-4 text-sm text-[var(--text-muted)]">
              {{ formatDateShort(account.createdAt) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="accounts.length === 0" class="text-center py-12">
        <Icon name="heroicons:identification" class="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
        <p class="text-[var(--text-muted)]">Аккаунтов не найдено</p>
      </div>
    </div>
  </div>
</template>
