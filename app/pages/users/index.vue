<script setup lang="ts">
import type { User } from '~/types/admin'
import type { ColumnConfig, FilterConfig } from '~/types/admin-list'
import {
  USER_STATUS,
  USER_STATUS_OPTIONS,
} from '~/composables/useStatusConfig'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Пользователи — Админ-панель' })

const router = useRouter()

// Конфигурация колонок
const columns: ColumnConfig[] = [
  { key: 'user', label: 'Пользователь' },
  { key: 'contacts', label: 'Контакты' },
  { key: 'status', label: 'Статус', badge: { config: USER_STATUS } },
  { key: 'accountsCount', label: 'Аккаунты' },
  { key: 'lastSeenAt', label: 'Последний визит', sortable: true, format: 'relative' },
  { key: 'createdAt', label: 'Создан', sortable: true, format: 'relative' },
]

// Конфигурация фильтров
const filters: FilterConfig[] = [
  { key: 'status', type: 'buttons', options: USER_STATUS_OPTIONS, defaultValue: 'all' },
]

// Переход к странице пользователя
function goToUser(user: User) {
  router.push(`/users/${user.id}`)
}
</script>

<template>
  <AdminListPage
    :columns="columns"
    :filters="filters"
    @row-click="goToUser"
    title="Пользователи"
    icon="heroicons:users"
    endpoint="/api/admin/users"
    response-key="users"
    search-placeholder="Поиск по имени, телефону, email..."
    empty-icon="heroicons:users"
    empty-text="Пользователей не найдено"
    create-url="/users/create"
    show-create-button
  >
    <!-- Кастомная ячейка пользователя -->
    <template #user="{ row }">
      <UserCell :user="row" />
    </template>

    <!-- Кастомная ячейка контактов -->
    <template #contacts="{ row }">
      <ContactsCell :phone="row.phone" :email="row.email" />
    </template>

    <!-- Количество аккаунтов -->
    <template #accountsCount="{ row }">
      <span class="text-sm text-[var(--text-secondary)]">{{ row.accountsCount }}</span>
    </template>
  </AdminListPage>
</template>
