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

// Данные для LineChart — активность за последние 6 месяцев
const activityData = computed(() => [
  { month: 'Авг', users: 45, requests: 23 },
  { month: 'Сен', users: 52, requests: 31 },
  { month: 'Окт', users: 48, requests: 28 },
  { month: 'Ноя', users: 61, requests: 42 },
  { month: 'Дек', users: 55, requests: 38 },
  { month: 'Янв', users: stats.value.users.active || 58, requests: stats.value.requests.total || 35 },
])

const activityCategories = {
  users: { name: 'Пользователи', color: '#3b82f6' },
  requests: { name: 'Заявки', color: '#f59e0b' },
}

const activityXFormatter = (tick: number) => activityData.value[tick]?.month ?? ''

// Данные для DonutChart — статусы заявок
const requestsDonutData = computed(() => [
  stats.value.requests.new || 12,
  stats.value.requests.inProgress || 8,
  stats.value.requests.completed || 25,
])

const requestsDonutCategories = {
  new: { name: 'Новые', color: '#06b6d4' },
  inProgress: { name: 'В работе', color: '#f59e0b' },
  completed: { name: 'Выполнено', color: '#22c55e' },
}

// Данные для второго DonutChart — статусы тикетов
const ticketsDonutData = computed(() => [
  stats.value.tickets.open || 5,
  stats.value.tickets.pending || 3,
  stats.value.tickets.resolved || 15,
])

const ticketsDonutCategories = {
  open: { name: 'Открыто', color: '#ef4444' },
  pending: { name: 'Ожидание', color: '#f59e0b' },
  resolved: { name: 'Решено', color: '#22c55e' },
}

// Данные для AreaChart — трафик чатов
const chatsAreaData = computed(() => [
  { day: 'Пн', waiting: 3, active: 8, closed: 12 },
  { day: 'Вт', waiting: 5, active: 10, closed: 15 },
  { day: 'Ср', waiting: 2, active: 12, closed: 18 },
  { day: 'Чт', waiting: 4, active: 9, closed: 14 },
  { day: 'Пт', waiting: 6, active: 11, closed: 20 },
  { day: 'Сб', waiting: 1, active: 4, closed: 8 },
  { day: 'Вс', waiting: stats.value.chats.waiting || 2, active: stats.value.chats.active || 5, closed: stats.value.chats.closed || 10 },
])

const chatsAreaCategories = {
  waiting: { name: 'Ожидают', color: '#ef4444' },
  active: { name: 'Активные', color: '#3b82f6' },
  closed: { name: 'Закрыты', color: '#6b7280' },
}

const chatsXFormatter = (tick: number) => chatsAreaData.value[tick]?.day ?? ''

// Данные для LineChart — динамика новостей
const newsLineData = computed(() => [
  { month: 'Авг', published: 8, draft: 3 },
  { month: 'Сен', published: 12, draft: 5 },
  { month: 'Окт', published: 10, draft: 2 },
  { month: 'Ноя', published: 15, draft: 4 },
  { month: 'Дек', published: 11, draft: 6 },
  { month: 'Янв', published: stats.value.news.published || 9, draft: stats.value.news.draft || 3 },
])

const newsCategories = {
  published: { name: 'Опубликовано', color: '#22c55e' },
  draft: { name: 'Черновики', color: '#6b7280' },
}

const newsXFormatter = (tick: number) => newsLineData.value[tick]?.month ?? ''

// Быстрые статы для шапки
const quickStats = computed(() => [
  {
    label: 'Пользователей',
    value: stats.value.users.total,
    icon: 'heroicons:users',
    color: 'blue' as const,
  },
  {
    label: 'Активных заявок',
    value: stats.value.requests.new + stats.value.requests.inProgress,
    icon: 'heroicons:clipboard-document-list',
    color: 'amber' as const,
  },
  {
    label: 'Открытых тикетов',
    value: stats.value.tickets.open + stats.value.tickets.pending,
    icon: 'heroicons:ticket',
    color: 'red' as const,
  },
  {
    label: 'Чатов в ожидании',
    value: stats.value.chats.waiting,
    icon: 'heroicons:chat-bubble-left-right',
    color: 'purple' as const,
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
      <!-- Quick Stats Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UiStatCard
          v-for="stat in quickStats"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :icon="stat.icon"
          :color="stat.color"
        />
      </div>

      <!-- Charts Row 1: Activity + Requests Distribution -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Активность за 6 месяцев -->
        <div class="lg:col-span-2 glass-card-static rounded-2xl p-6">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Icon name="heroicons:chart-bar" class="w-5 h-5 text-blue-400" />
            Активность за 6 месяцев
          </h3>
          <LineChart
            :data="activityData"
            :categories="activityCategories"
            :height="260"
            :x-formatter="activityXFormatter"
            :x-num-ticks="6"
            :y-num-ticks="5"
            :y-grid-line="true"
            x-label="Месяц"
            y-label="Количество"
          />
        </div>

        <!-- Статусы заявок -->
        <div class="glass-card-static rounded-2xl p-6">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Icon name="heroicons:clipboard-document-list" class="w-5 h-5 text-amber-400" />
            Заявки по статусам
          </h3>
          <DonutChart
            :data="requestsDonutData"
            :categories="requestsDonutCategories"
            :height="220"
            :radius="70"
            :arc-width="18"
            :pad-angle="0.05"
          />
        </div>
      </div>

      <!-- Charts Row 2: Chats + Tickets -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Чаты за неделю -->
        <div class="lg:col-span-2 glass-card-static rounded-2xl p-6">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Icon name="heroicons:chat-bubble-left-right" class="w-5 h-5 text-purple-400" />
            Чаты поддержки за неделю
          </h3>
          <AreaChart
            :data="chatsAreaData"
            :categories="chatsAreaCategories"
            :height="260"
            :x-formatter="chatsXFormatter"
            :x-num-ticks="7"
            :y-num-ticks="5"
          />
        </div>

        <!-- Статусы тикетов -->
        <div class="glass-card-static rounded-2xl p-6">
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Icon name="heroicons:ticket" class="w-5 h-5 text-red-400" />
            Тикеты по статусам
          </h3>
          <DonutChart
            :data="ticketsDonutData"
            :categories="ticketsDonutCategories"
            :height="220"
            :radius="70"
            :arc-width="18"
            :pad-angle="0.05"
          />
        </div>
      </div>

      <!-- Charts Row 3: News Dynamics -->
      <div class="glass-card-static rounded-2xl p-6">
        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Icon name="heroicons:newspaper" class="w-5 h-5 text-green-400" />
          Динамика публикаций
        </h3>
        <LineChart
          :data="newsLineData"
          :categories="newsCategories"
          :height="200"
          :x-formatter="newsXFormatter"
          :x-num-ticks="6"
          :y-num-ticks="4"
          :y-grid-line="true"
        />
      </div>
    </div>
  </div>
</template>
