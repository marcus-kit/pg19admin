<script setup lang="ts">
import type { User } from '~/types/admin'
import {
  USER_STATUS,
  USER_STATUS_OPTIONS,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'
import { useAdminList } from '~/composables/useAdminList'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Пользователи — Админ-панель' })

const router = useRouter()

// Use centralized list composable
const {
  items: users,
  loading,
  total,
  filters,
  searchQuery,
  onSearchInput,
} = useAdminList<User, { status: string }>({
  endpoint: '/api/admin/users',
  responseKey: 'users',
  initialFilters: { status: 'all' },
})

// Online status uses simple class mapping (not badgeClass)
const getOnlineStatusClass = (status: string) => {
  switch (status) {
    case 'online': return 'bg-green-500'
    case 'away': return 'bg-yellow-500'
    default: return 'bg-gray-500'
  }
}

const columns = [
  { key: 'user', label: 'Пользователь' },
  { key: 'contacts', label: 'Контакты' },
  { key: 'status', label: 'Статус' },
  { key: 'accountsCount', label: 'Аккаунты' },
  { key: 'lastSeenAt', label: 'Последний визит', sortable: true },
  { key: 'createdAt', label: 'Создан', sortable: true },
]

const goToUser = (user: User) => {
  router.push(`/users/${user.id}`)
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <h1 class="text-3xl font-bold text-[var(--text-primary)]">
        Пользователи
        <span v-if="total > 0" class="text-lg font-normal text-[var(--text-muted)]">
          ({{ total }})
        </span>
      </h1>
      <UiButton

        @click="router.push('/users/create')"
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
          v-for="opt in USER_STATUS_OPTIONS"
          :key="opt.value"
          :class="{ 'bg-primary/20': filters.status === opt.value }"
          variant="ghost"
          size="sm"
          @click="filters.status = opt.value"
        >
          {{ opt.label }}
        </UiButton>
      </div>

      <!-- Search -->
      <div class="ml-auto">
        <UiInput
          v-model="searchQuery"
          placeholder="Поиск по имени, телефону, email..."
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

    <!-- Users Table -->
    <UiTable
      v-else
      :data="users"
      :columns="columns"
      empty-icon="heroicons:users"
      empty-text="Пользователей не найдено"
      @row-click="goToUser"
    >
      <template #user="{ row }">
        <div class="flex items-center gap-3">
          <!-- Avatar -->
          <div class="relative">
            <div
              v-if="row.avatar"
              :style="{ backgroundImage: `url(${row.avatar})` }"
              class="w-10 h-10 rounded-full bg-cover bg-center"
            />
            <div
              v-else
              class="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center"
            >
              <span class="text-sm font-medium text-[var(--text-primary)]">
                {{ row.firstName?.charAt(0) || '?' }}{{ row.lastName?.charAt(0) || '' }}
              </span>
            </div>
            <!-- Online indicator -->
            <div
              :class="getOnlineStatusClass(row.onlineStatus)"
              class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-base)]"
            />
          </div>
          <!-- Name -->
          <div>
            <p class="font-medium text-[var(--text-primary)]">{{ row.fullName }}</p>
            <p v-if="row.telegram?.username" class="text-xs text-[var(--text-muted)]">
              @{{ row.telegram.username }}
            </p>
          </div>
        </div>
      </template>

      <template #contacts="{ row }">
        <div class="text-sm">
          <p v-if="row.phone" class="text-[var(--text-secondary)]">{{ row.phone }}</p>
          <p v-if="row.email" class="text-[var(--text-muted)] text-xs">{{ row.email }}</p>
          <p v-if="!row.phone && !row.email" class="text-[var(--text-muted)]">—</p>
        </div>
      </template>

      <template #status="{ row }">
        <UiBadge :class="getStatusBadgeClass(USER_STATUS, row.status)" size="sm">
          {{ getStatusLabel(USER_STATUS, row.status) }}
        </UiBadge>
      </template>

      <template #accountsCount="{ row }">
        <span class="text-sm text-[var(--text-secondary)]">{{ row.accountsCount }}</span>
      </template>

      <template #lastSeenAt="{ row }">
        <span class="text-sm text-[var(--text-muted)]">
          <UiRelativeTime :date="row.lastSeenAt" />
        </span>
      </template>

      <template #createdAt="{ row }">
        <span class="text-sm text-[var(--text-muted)]">
          <UiRelativeTime :date="row.createdAt" />
        </span>
      </template>
    </UiTable>
  </div>
</template>
