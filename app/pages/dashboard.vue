<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Админ-панель — ПЖ19' })

const toast = useToast()

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

const loading = ref(true)
const stats = ref<DashboardStats>({
  news: { total: 0, published: 0, draft: 0, archived: 0 },
  users: { total: 0, active: 0, newToday: 0, activeContracts: 0 },
  catalog: { services: 0, activeServices: 0, categories: 0, activeCategories: 0 },
  requests: { total: 0, new: 0, inProgress: 0, completed: 0 },
  chats: { total: 0, waiting: 0, active: 0, closed: 0 },
  tickets: { total: 0, open: 0, pending: 0, resolved: 0 },
})

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const data = await $fetch<DashboardStats>('/api/admin/dashboard/stats')
    stats.value = data
  }
  catch (error) {
    console.error('Failed to fetch dashboard data:', error)
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
    <div v-if="loading" class="flex justify-center py-12">
      <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div v-else class="space-y-8">
      <!-- News Stats -->
      <div>
        <h2 class="text-lg font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
          <Icon name="heroicons:newspaper" class="w-5 h-5" />
          Статистика новостей
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Всего</p>
                <p class="text-2xl font-bold text-[var(--text-primary)]">{{ stats.news.total }}</p>
              </div>
              <div class="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:document-text" class="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Опубликовано</p>
                <p class="text-2xl font-bold text-green-400">{{ stats.news.published }}</p>
              </div>
              <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:check-circle" class="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Черновики</p>
                <p class="text-2xl font-bold text-gray-400">{{ stats.news.draft }}</p>
              </div>
              <div class="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:pencil-square" class="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">В архиве</p>
                <p class="text-2xl font-bold text-orange-400">{{ stats.news.archived }}</p>
              </div>
              <div class="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:archive-box" class="w-5 h-5 text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Users Stats -->
      <div>
        <h2 class="text-lg font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
          <Icon name="heroicons:users" class="w-5 h-5" />
          Статистика пользователей
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Всего</p>
                <p class="text-2xl font-bold text-[var(--text-primary)]">{{ stats.users.total }}</p>
              </div>
              <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:user-group" class="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Активных</p>
                <p class="text-2xl font-bold text-green-400">{{ stats.users.active }}</p>
              </div>
              <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:user-circle" class="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Новых сегодня</p>
                <p class="text-2xl font-bold text-cyan-400">{{ stats.users.newToday }}</p>
              </div>
              <div class="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:user-plus" class="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Активных договоров</p>
                <p class="text-2xl font-bold text-purple-400">{{ stats.users.activeContracts }}</p>
              </div>
              <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:document-check" class="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Catalog Stats -->
      <div>
        <h2 class="text-lg font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
          <Icon name="heroicons:squares-2x2" class="w-5 h-5" />
          Статистика каталога
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Всего услуг</p>
                <p class="text-2xl font-bold text-[var(--text-primary)]">{{ stats.catalog.services }}</p>
              </div>
              <div class="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:cube" class="w-5 h-5 text-indigo-400" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Активных услуг</p>
                <p class="text-2xl font-bold text-green-400">{{ stats.catalog.activeServices }}</p>
              </div>
              <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:check-badge" class="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Категорий</p>
                <p class="text-2xl font-bold text-amber-400">{{ stats.catalog.categories }}</p>
              </div>
              <div class="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:folder" class="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Активных категорий</p>
                <p class="text-2xl font-bold text-green-400">{{ stats.catalog.activeCategories }}</p>
              </div>
              <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:folder-open" class="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Requests Stats -->
      <div>
        <h2 class="text-lg font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
          <Icon name="heroicons:clipboard-document-list" class="w-5 h-5" />
          Заявки на подключение
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Всего</p>
                <p class="text-2xl font-bold text-[var(--text-primary)]">{{ stats.requests.total }}</p>
              </div>
              <div class="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:document-text" class="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Новых</p>
                <p class="text-2xl font-bold text-cyan-400">{{ stats.requests.new }}</p>
              </div>
              <div class="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:sparkles" class="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">В работе</p>
                <p class="text-2xl font-bold text-amber-400">{{ stats.requests.inProgress }}</p>
              </div>
              <div class="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:clock" class="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Выполнено</p>
                <p class="text-2xl font-bold text-green-400">{{ stats.requests.completed }}</p>
              </div>
              <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:check-circle" class="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chats Stats -->
      <div>
        <h2 class="text-lg font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
          <Icon name="heroicons:chat-bubble-left-right" class="w-5 h-5" />
          Чаты поддержки
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Всего</p>
                <p class="text-2xl font-bold text-[var(--text-primary)]">{{ stats.chats.total }}</p>
              </div>
              <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:chat-bubble-oval-left-ellipsis" class="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Ожидают</p>
                <p class="text-2xl font-bold text-red-400">{{ stats.chats.waiting }}</p>
              </div>
              <div class="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:exclamation-circle" class="w-5 h-5 text-red-400" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Активных</p>
                <p class="text-2xl font-bold text-green-400">{{ stats.chats.active }}</p>
              </div>
              <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:chat-bubble-left-ellipsis" class="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Закрыто</p>
                <p class="text-2xl font-bold text-gray-400">{{ stats.chats.closed }}</p>
              </div>
              <div class="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:check-circle" class="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tickets Stats -->
      <div>
        <h2 class="text-lg font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
          <Icon name="heroicons:ticket" class="w-5 h-5" />
          Тикеты
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Всего</p>
                <p class="text-2xl font-bold text-[var(--text-primary)]">{{ stats.tickets.total }}</p>
              </div>
              <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:ticket" class="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Открытых</p>
                <p class="text-2xl font-bold text-red-400">{{ stats.tickets.open }}</p>
              </div>
              <div class="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:inbox-arrow-down" class="w-5 h-5 text-red-400" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">В ожидании</p>
                <p class="text-2xl font-bold text-amber-400">{{ stats.tickets.pending }}</p>
              </div>
              <div class="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:clock" class="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>

          <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-[var(--text-muted)] mb-1">Решено</p>
                <p class="text-2xl font-bold text-green-400">{{ stats.tickets.resolved }}</p>
              </div>
              <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Icon name="heroicons:check-badge" class="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
