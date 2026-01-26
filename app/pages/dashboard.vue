<script setup lang="ts">
// Интерфейс статистики дашборда
interface DashboardStats {
  news: {
    total: number
    published: number
    draft: number
    archived: number
  }
  users: {
    total: number
    active: number
    newToday: number
    activeContracts: number
  }
  catalog: {
    services: number
    activeServices: number
    categories: number
    activeCategories: number
  }
  requests: {
    total: number
    new: number
    inProgress: number
    completed: number
  }
  chats: {
    total: number
    waiting: number
    active: number
    closed: number
  }
  tickets: {
    total: number
    open: number
    pending: number
    resolved: number
  }
}

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Админ-панель — ПЖ19' })

const toast = useToast()

const loading = ref(true)
const stats = ref<DashboardStats>({
  news: { total: 0, published: 0, draft: 0, archived: 0 },
  users: { total: 0, active: 0, newToday: 0, activeContracts: 0 },
  catalog: { services: 0, activeServices: 0, categories: 0, activeCategories: 0 },
  requests: { total: 0, new: 0, inProgress: 0, completed: 0 },
  chats: { total: 0, waiting: 0, active: 0, closed: 0 },
  tickets: { total: 0, open: 0, pending: 0, resolved: 0 },
})

// Конфигурация секций дашборда
const sections = computed(() => [
  {
    title: 'Статистика новостей',
    icon: 'heroicons:newspaper',
    cards: [
      { label: 'Всего', value: stats.value.news.total, icon: 'heroicons:document-text', color: 'primary' as const },
      { label: 'Опубликовано', value: stats.value.news.published, icon: 'heroicons:check-circle', color: 'green' as const },
      { label: 'Черновики', value: stats.value.news.draft, icon: 'heroicons:pencil-square', color: 'gray' as const },
      { label: 'В архиве', value: stats.value.news.archived, icon: 'heroicons:archive-box', color: 'orange' as const },
    ],
  },
  {
    title: 'Статистика пользователей',
    icon: 'heroicons:users',
    cards: [
      { label: 'Всего', value: stats.value.users.total, icon: 'heroicons:user-group', color: 'blue' as const },
      { label: 'Активных', value: stats.value.users.active, icon: 'heroicons:user-circle', color: 'green' as const },
      { label: 'Новых сегодня', value: stats.value.users.newToday, icon: 'heroicons:user-plus', color: 'cyan' as const },
      { label: 'Активных договоров', value: stats.value.users.activeContracts, icon: 'heroicons:document-check', color: 'purple' as const },
    ],
  },
  {
    title: 'Статистика каталога',
    icon: 'heroicons:squares-2x2',
    cards: [
      { label: 'Всего услуг', value: stats.value.catalog.services, icon: 'heroicons:cube', color: 'indigo' as const },
      { label: 'Активных услуг', value: stats.value.catalog.activeServices, icon: 'heroicons:check-badge', color: 'green' as const },
      { label: 'Категорий', value: stats.value.catalog.categories, icon: 'heroicons:folder', color: 'amber' as const },
      { label: 'Активных категорий', value: stats.value.catalog.activeCategories, icon: 'heroicons:folder-open', color: 'green' as const },
    ],
  },
  {
    title: 'Заявки на подключение',
    icon: 'heroicons:clipboard-document-list',
    cards: [
      { label: 'Всего', value: stats.value.requests.total, icon: 'heroicons:document-text', color: 'primary' as const },
      { label: 'Новых', value: stats.value.requests.new, icon: 'heroicons:sparkles', color: 'cyan' as const },
      { label: 'В работе', value: stats.value.requests.inProgress, icon: 'heroicons:clock', color: 'amber' as const },
      { label: 'Выполнено', value: stats.value.requests.completed, icon: 'heroicons:check-circle', color: 'green' as const },
    ],
  },
  {
    title: 'Чаты поддержки',
    icon: 'heroicons:chat-bubble-left-right',
    cards: [
      { label: 'Всего', value: stats.value.chats.total, icon: 'heroicons:chat-bubble-oval-left-ellipsis', color: 'blue' as const },
      { label: 'Ожидают', value: stats.value.chats.waiting, icon: 'heroicons:exclamation-circle', color: 'red' as const },
      { label: 'Активных', value: stats.value.chats.active, icon: 'heroicons:chat-bubble-left-ellipsis', color: 'green' as const },
      { label: 'Закрыто', value: stats.value.chats.closed, icon: 'heroicons:check-circle', color: 'gray' as const },
    ],
  },
  {
    title: 'Тикеты',
    icon: 'heroicons:ticket',
    cards: [
      { label: 'Всего', value: stats.value.tickets.total, icon: 'heroicons:ticket', color: 'purple' as const },
      { label: 'Открытых', value: stats.value.tickets.open, icon: 'heroicons:inbox-arrow-down', color: 'red' as const },
      { label: 'В ожидании', value: stats.value.tickets.pending, icon: 'heroicons:clock', color: 'amber' as const },
      { label: 'Решено', value: stats.value.tickets.resolved, icon: 'heroicons:check-badge', color: 'green' as const },
    ],
  },
])

// Загрузка статистики дашборда
async function fetchDashboardData() {
  loading.value = true
  try {
    const data = await $fetch<DashboardStats>('/api/admin/dashboard/stats')
    stats.value = data
  }
  catch {
    toast.error('Не удалось загрузить статистику')
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-[var(--text-primary)] mb-2">
        Добро пожаловать!
      </h1>
      <p class="text-[var(--text-muted)]">
        Панель управления сайтом ПЖ19
      </p>
    </div>

    <!-- Loading -->
    <UiLoading v-if="loading" />

    <div v-else class="space-y-8">
      <!-- Stats Sections -->
      <div v-for="section in sections" :key="section.title">
        <h2 class="text-lg font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
          <Icon :name="section.icon" class="w-5 h-5" />
          {{ section.title }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <UiStatCard
            v-for="card in section.cards"
            :key="card.label"
            :label="card.label"
            :value="card.value"
            :icon="card.icon"
            :color="card.color"
          />
        </div>
      </div>
    </div>
  </div>
</template>
