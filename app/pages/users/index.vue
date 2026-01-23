<script setup lang="ts">
import type { User } from '~/types/admin'
import {
  USER_STATUS,
  USER_STATUS_OPTIONS,
  ONLINE_STATUS,
  getStatusLabel,
  getStatusBadgeClass
} from '~/composables/useStatusConfig'
import { useAdminList } from '~/composables/useAdminList'
import { useAdminAuthStore } from '~/stores/adminAuth'

definePageMeta({
  middleware: 'admin'
})

useHead({ title: 'Пользователи — Админ-панель' })

const adminAuthStore = useAdminAuthStore()
const router = useRouter()

// Use centralized list composable
const {
  items: users,
  loading,
  total,
  filters,
  searchQuery,
  onSearchInput
} = useAdminList<User, { status: string }>({
  endpoint: '/api/admin/users',
  responseKey: 'users',
  initialFilters: { status: 'all' }
})

// Online status uses simple class mapping (not badgeClass)
const getOnlineStatusClass = (status: string) => {
  switch (status) {
    case 'online': return 'bg-green-500'
    case 'away': return 'bg-yellow-500'
    default: return 'bg-gray-500'
  }
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
        v-if="adminAuthStore.canCreateUsers"
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
          variant="ghost"
          size="sm"
          :class="{ 'bg-primary/20': filters.status === opt.value }"
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
    <div v-if="loading" class="flex justify-center py-12">
      <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Users Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-[var(--glass-border)]">
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Пользователь</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Контакты</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Статус</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Аккаунты</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Последний визит</th>
            <th class="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Создан</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in users"
            :key="user.id"
            class="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] cursor-pointer transition-colors"
            @click="router.push(`/users/${user.id}`)"
          >
            <td class="py-3 px-4">
              <div class="flex items-center gap-3">
                <!-- Avatar -->
                <div class="relative">
                  <div
                    v-if="user.avatar"
                    class="w-10 h-10 rounded-full bg-cover bg-center"
                    :style="{ backgroundImage: `url(${user.avatar})` }"
                  />
                  <div
                    v-else
                    class="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center"
                  >
                    <span class="text-sm font-medium text-[var(--text-primary)]">
                      {{ user.firstName?.charAt(0) || '?' }}{{ user.lastName?.charAt(0) || '' }}
                    </span>
                  </div>
                  <!-- Online indicator -->
                  <div
                    :class="getOnlineStatusClass(user.onlineStatus)"
                    class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-base)]"
                  />
                </div>
                <!-- Name -->
                <div>
                  <p class="font-medium text-[var(--text-primary)]">{{ user.fullName }}</p>
                  <p v-if="user.telegram?.username" class="text-xs text-[var(--text-muted)]">
                    @{{ user.telegram.username }}
                  </p>
                </div>
              </div>
            </td>
            <td class="py-3 px-4">
              <div class="text-sm">
                <p v-if="user.phone" class="text-[var(--text-secondary)]">{{ user.phone }}</p>
                <p v-if="user.email" class="text-[var(--text-muted)] text-xs">{{ user.email }}</p>
                <p v-if="!user.phone && !user.email" class="text-[var(--text-muted)]">—</p>
              </div>
            </td>
            <td class="py-3 px-4">
              <UiBadge :class="getStatusBadgeClass(USER_STATUS, user.status)" size="sm">
                {{ getStatusLabel(USER_STATUS, user.status) }}
              </UiBadge>
            </td>
            <td class="py-3 px-4 text-sm text-[var(--text-secondary)]">
              {{ user.accountsCount }}
            </td>
            <td class="py-3 px-4 text-sm text-[var(--text-muted)]">
              <UiRelativeTime :date="user.lastSeenAt" />
            </td>
            <td class="py-3 px-4 text-sm text-[var(--text-muted)]">
              <UiRelativeTime :date="user.createdAt" />
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="users.length === 0" class="text-center py-12">
        <Icon name="heroicons:users" class="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
        <p class="text-[var(--text-muted)]">Пользователей не найдено</p>
      </div>
    </div>
  </div>
</template>
