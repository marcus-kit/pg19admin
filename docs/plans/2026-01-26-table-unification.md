# Table Unification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Унифицировать стили таблиц и card-списков по всему проекту через создание переиспользуемого UiTable компонента.

**Architecture:** Создаём declarative UiTable компонент с props для колонок, slots для кастомного рендеринга ячеек, и v-model:sort для сортировки. Card-списки унифицируем через UiCard компонент.

**Tech Stack:** Vue 3.5, Nuxt 4.3, TypeScript, Tailwind CSS

---

## Task 1: Create UiTable Component

**Files:**
- Create: `app/components/ui/UiTable.vue`

**Step 1: Create the UiTable component file**

```vue
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
```

**Step 2: Verify component file created correctly**

Run: `ls -la app/components/ui/UiTable.vue`
Expected: File exists

**Step 3: Commit**

```bash
git add app/components/ui/UiTable.vue
git commit -m "feat(ui): add UiTable component with sorting support

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Add CSS Styles for UiTable

**Files:**
- Modify: `app/assets/css/main.css`

**Step 1: Replace .admin-table with .ui-table styles**

Find and replace the `.admin-table` block (lines 242-272) with:

```css
/* -----------------------------------------------------------------------------
   UI Table — стили унифицированной таблицы (UiTable)
   ----------------------------------------------------------------------------- */
.ui-table {
  width: 100%;
}

.ui-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  border-bottom: 1px solid var(--glass-border);
  white-space: nowrap;
}

.ui-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.ui-table th.sortable:hover {
  color: var(--text-primary);
}

.ui-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--glass-border);
}

.ui-table tr:last-child td {
  border-bottom: none;
}

.ui-table tbody tr.clickable {
  cursor: pointer;
  transition: background-color 0.15s;
}

.ui-table tbody tr.clickable:hover {
  background: var(--glass-bg);
}
```

**Step 2: Remove unused CSS variables**

Delete these lines from `:root` and `.dark` sections:
```css
/* Таблицы (админ-специфично) */
--table-header-bg: rgba(0, 0, 0, 0.02);
--table-row-hover: rgba(247, 148, 29, 0.05);
--table-border: rgba(0, 0, 0, 0.06);
```

**Note:** Keep `--table-header-bg` only if it's used in `.tiptap-toolbar` (check first!)

**Step 3: Verify CSS is valid**

Run: `pnpm nuxt typecheck` (catches import errors, not CSS, but ensures no breaks)

**Step 4: Commit**

```bash
git add app/assets/css/main.css
git commit -m "refactor(css): replace .admin-table with .ui-table, remove dead code

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Migrate Users Page to UiTable

**Files:**
- Modify: `app/pages/users/index.vue`

**Step 1: Define columns configuration**

Add after the `getOnlineStatusClass` function:

```typescript
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
```

**Step 2: Replace table HTML with UiTable**

Replace lines 98-179 (the entire `<div v-else class="overflow-x-auto">...</div>` block) with:

```vue
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
```

**Step 3: Verify page renders**

Run dev server and check `/users` page loads correctly.

**Step 4: Commit**

```bash
git add app/pages/users/index.vue
git commit -m "refactor(users): migrate to UiTable component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Migrate Accounts Page to UiTable

**Files:**
- Modify: `app/pages/accounts/index.vue`

**Step 1: Add columns and imports**

Add after the `useAdminList` call:

```typescript
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
```

**Step 2: Replace table HTML with UiTable**

Replace lines 99-167 with:

```vue
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
```

**Step 3: Remove unused formatBalance/formatDateShort if already in script**

Check if `formatBalance` and `formatDateShort` are already defined/imported.

**Step 4: Commit**

```bash
git add app/pages/accounts/index.vue
git commit -m "refactor(accounts): migrate to UiTable component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Migrate Tickets Page to UiTable

**Files:**
- Modify: `app/pages/tickets/index.vue`

**Step 1: Add columns configuration**

Add after `goToTicket` function:

```typescript
const columns = [
  { key: 'number', label: 'Номер' },
  { key: 'subject', label: 'Тема' },
  { key: 'status', label: 'Статус' },
  { key: 'priority', label: 'Приоритет' },
  { key: 'assignedAdmin', label: 'Назначен' },
  { key: 'createdAt', label: 'Создан', sortable: true },
]
```

**Step 2: Replace table HTML with UiTable**

Replace lines 96-153 with:

```vue
<UiTable
  v-else
  :data="tickets"
  :columns="columns"
  empty-icon="heroicons:ticket"
  empty-text="Тикетов не найдено"
  @row-click="(row) => goToTicket(row.id)"
>
  <template #number="{ row }">
    <span class="font-mono text-sm text-primary">{{ row.number }}</span>
  </template>

  <template #subject="{ row }">
    <div class="max-w-md">
      <p class="font-medium text-[var(--text-primary)] truncate">{{ row.subject }}</p>
      <p class="text-xs text-[var(--text-muted)]">
        {{ row.userName || `Пользователь #${row.userId}` }}
        <span v-if="row.userEmail" class="ml-1">· {{ row.userEmail }}</span>
      </p>
    </div>
  </template>

  <template #status="{ row }">
    <UiBadge :class="getStatusBadgeClass(TICKET_STATUS, row.status)" size="sm">
      {{ getStatusLabel(TICKET_STATUS, row.status) }}
    </UiBadge>
  </template>

  <template #priority="{ row }">
    <UiBadge :class="getStatusBadgeClass(TICKET_PRIORITY, row.priority)" size="sm">
      {{ getStatusLabel(TICKET_PRIORITY, row.priority) }}
    </UiBadge>
  </template>

  <template #assignedAdmin="{ row }">
    <span class="text-sm text-[var(--text-secondary)]">
      {{ row.assignedAdmin?.fullName || '—' }}
    </span>
  </template>

  <template #createdAt="{ row }">
    <span class="text-sm text-[var(--text-muted)]">{{ formatDateTime(row.createdAt) }}</span>
  </template>
</UiTable>
```

**Step 3: Commit**

```bash
git add app/pages/tickets/index.vue
git commit -m "refactor(tickets): migrate to UiTable component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Unify Chat Page Cards to UiCard

**Files:**
- Modify: `app/pages/chat/index.vue`

**Step 1: Replace div.glass-card with UiCard**

Replace lines 75-130 (the `<div v-for="chat in chats"...` block) with:

```vue
<UiCard
  v-for="chat in chats"
  :key="chat.id"
  :hover="true"
  padding="sm"
  class="cursor-pointer"
  @click="goToChat(chat.id)"
>
  <div class="flex items-start justify-between gap-4">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1 flex-wrap">
        <span class="font-medium text-[var(--text-primary)]">
          {{ chat.userName || `Чат #${chat.id}` }}
        </span>
        <span v-if="chat.guestContact" class="text-xs text-[var(--text-muted)]">
          ({{ chat.guestContact }})
        </span>
        <UiBadge v-if="chat.guestName && !chat.userId" class="bg-purple-500/20 text-purple-400" size="sm">
          Гость
        </UiBadge>
        <UiBadge :class="getStatusBadgeClass(CHAT_STATUS, chat.status)" size="sm">
          {{ getStatusLabel(CHAT_STATUS, chat.status) }}
        </UiBadge>
        <span
          v-if="chat.unreadAdminCount > 0"
          class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full"
        >
          {{ chat.unreadAdminCount > 9 ? '9+' : chat.unreadAdminCount }}
        </span>
      </div>

      <p v-if="chat.subject" class="text-sm text-[var(--text-secondary)] truncate mb-1">
        {{ chat.subject }}
      </p>

      <div class="flex items-center gap-3 text-xs text-[var(--text-muted)]">
        <span v-if="chat.assignedAdmin" class="flex items-center gap-1">
          <Icon name="heroicons:user" class="w-3 h-3" />
          {{ chat.assignedAdmin.fullName }}
        </span>
        <span v-if="chat.userTelegramId" class="flex items-center gap-1">
          <Icon name="simple-icons:telegram" class="w-3 h-3" />
          {{ chat.userTelegramId }}
        </span>
      </div>
    </div>

    <div class="text-right shrink-0">
      <span class="text-xs text-[var(--text-muted)]">
        <UiRelativeTime :date="chat.lastMessageAt" />
      </span>
      <Icon
        name="heroicons:chevron-right"
        class="w-5 h-5 text-[var(--text-muted)] mt-2"
      />
    </div>
  </div>
</UiCard>
```

**Step 2: Commit**

```bash
git add app/pages/chat/index.vue
git commit -m "refactor(chat): replace div.glass-card with UiCard

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Unify ConnectionRequestsTab to UiCard

**Files:**
- Modify: `app/components/requests/ConnectionRequestsTab.vue`

**Step 1: Replace div.glass-card with UiCard**

Replace lines 77-138 (the `<div v-for="request in requests"...` block) with:

```vue
<UiCard
  v-for="request in requests"
  :key="request.id"
  :hover="true"
  padding="sm"
  class="cursor-pointer"
  @click="goToRequest(request.id)"
>
  <div class="flex items-start justify-between gap-4">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-2 flex-wrap">
        <span class="font-medium text-[var(--text-primary)]">
          {{ request.fullName }}
        </span>
        <span class="text-sm text-[var(--text-muted)]">
          {{ formatPhone(request.phone) }}
        </span>
      </div>

      <div class="flex items-center gap-2 mb-2 flex-wrap">
        <UiBadge :class="getStatusBadgeClass(CONNECTION_REQUEST_STATUS, request.status)" size="sm">
          {{ getStatusLabel(CONNECTION_REQUEST_STATUS, request.status) }}
        </UiBadge>
        <UiBadge
          v-if="request.inCoverageZone"
          class="bg-green-500/20 text-green-400"
          size="sm"
        >
          <Icon name="heroicons:check" class="w-3 h-3 mr-1" />
          В зоне
        </UiBadge>
        <UiBadge
          v-else
          class="bg-orange-500/20 text-orange-400"
          size="sm"
        >
          <Icon name="heroicons:exclamation-triangle" class="w-3 h-3 mr-1" />
          Вне зоны
        </UiBadge>
      </div>

      <p class="text-sm text-[var(--text-secondary)] truncate mb-2">
        {{ request.addressText }}
      </p>

      <div class="flex items-center gap-3 text-xs text-[var(--text-muted)]">
        <span class="flex items-center gap-1">
          <Icon name="heroicons:globe-alt" class="w-3 h-3" />
          {{ getStatusLabel(REQUEST_SOURCE, request.source) }}
        </span>
        <span>
          {{ formatDateTime(request.createdAt) }}
        </span>
      </div>
    </div>

    <div class="shrink-0 flex items-center">
      <Icon
        name="heroicons:chevron-right"
        class="w-5 h-5 text-[var(--text-muted)]"
      />
    </div>
  </div>
</UiCard>
```

**Step 2: Update empty state to use UiEmptyState**

Replace lines 140-145 with:

```vue
<UiEmptyState
  v-if="requests.length === 0"
  icon="heroicons:clipboard-document-list"
  :title="statusFilter === 'all' ? 'Заявок на подключение пока нет' : 'Нет заявок с таким статусом'"
/>
```

**Step 3: Commit**

```bash
git add app/components/requests/ConnectionRequestsTab.vue
git commit -m "refactor(requests): migrate ConnectionRequestsTab to UiCard

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Unify CallbackRequestsTab to UiCard

**Files:**
- Modify: `app/components/requests/CallbackRequestsTab.vue`

**Step 1: Replace div.glass-card with UiCard**

Replace lines 59-136 (the `<div v-for="callback in requests"...` block) with:

```vue
<UiCard
  v-for="callback in requests"
  :key="callback.id"
  padding="sm"
>
  <div class="flex items-start justify-between gap-4">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-2 flex-wrap">
        <span class="font-medium text-[var(--text-primary)]">
          {{ callback.name }}
        </span>
        <a
          :href="`tel:${callback.phone}`"
          class="text-sm text-primary hover:underline"
          @click.stop
        >
          {{ formatPhone(callback.phone) }}
        </a>
      </div>

      <div class="flex items-center gap-2 mb-2 flex-wrap">
        <UiBadge :class="getStatusBadgeClass(CALLBACK_REQUEST_STATUS, callback.status)" size="sm">
          {{ getStatusLabel(CALLBACK_REQUEST_STATUS, callback.status) }}
        </UiBadge>
      </div>

      <div class="flex items-center gap-3 text-xs text-[var(--text-muted)]">
        <span class="flex items-center gap-1">
          <Icon name="heroicons:globe-alt" class="w-3 h-3" />
          {{ callback.source ? getStatusLabel(REQUEST_SOURCE, callback.source) : 'Неизвестно' }}
        </span>
        <span>
          {{ formatDateTime(callback.createdAt) }}
        </span>
        <span v-if="callback.processedByAdmin" class="flex items-center gap-1">
          <Icon name="heroicons:user" class="w-3 h-3" />
          {{ callback.processedByAdmin.fullName }}
        </span>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="shrink-0 flex items-center gap-2">
      <!-- Call button -->
      <a
        :href="`tel:${callback.phone}`"
        class="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
        title="Позвонить"
        @click.stop
      >
        <Icon name="heroicons:phone" class="w-4 h-4 text-green-400" />
      </a>

      <!-- Status dropdown -->
      <div class="relative group">
        <button
          class="p-2 rounded-lg hover:bg-[var(--glass-bg)] transition-colors"
          title="Изменить статус"
        >
          <Icon name="heroicons:ellipsis-vertical" class="w-4 h-4 text-[var(--text-muted)]" />
        </button>
        <div
          class="absolute right-0 top-full mt-1 w-40 py-1 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10"
          style="background: var(--bg-surface); border: 1px solid var(--glass-border);"
        >
          <button
            v-for="opt in CALLBACK_STATUS_OPTIONS.filter(o => o.value !== 'all' && o.value !== callback.status)"
            :key="opt.value"
            class="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-colors"
            @click="handleStatusUpdate(callback, opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</UiCard>
```

**Step 2: Update empty state to use UiEmptyState**

Replace lines 138-143 with:

```vue
<UiEmptyState
  v-if="requests.length === 0"
  icon="heroicons:phone-x-mark"
  :title="statusFilter === 'all' ? 'Заявок на звонок пока нет' : 'Нет заявок с таким статусом'"
/>
```

**Step 3: Commit**

```bash
git add app/components/requests/CallbackRequestsTab.vue
git commit -m "refactor(requests): migrate CallbackRequestsTab to UiCard

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Final Verification and Push

**Step 1: Run type check**

Run: `pnpm nuxt typecheck`
Expected: No TypeScript errors

**Step 2: Start dev server and test all pages**

Run: `pnpm dev`

Test pages:
- `/users` - UiTable with avatar slots
- `/accounts` - UiTable with balance colors
- `/tickets` - UiTable with status badges
- `/chat` - UiCard list
- `/requests` - Both tabs with UiCard

**Step 3: Final commit and push**

```bash
git push
```

---

## Summary

| Task | Component/File | Change |
|------|---------------|--------|
| 1 | UiTable.vue | Create new component |
| 2 | main.css | Replace .admin-table → .ui-table |
| 3 | users/index.vue | Migrate to UiTable |
| 4 | accounts/index.vue | Migrate to UiTable |
| 5 | tickets/index.vue | Migrate to UiTable |
| 6 | chat/index.vue | div.glass-card → UiCard |
| 7 | ConnectionRequestsTab.vue | div.glass-card → UiCard |
| 8 | CallbackRequestsTab.vue | div.glass-card → UiCard |
| 9 | — | Verify & push |

**Total: 8 files modified, 1 created, ~180 lines of dead code removed**
