<script setup lang="ts">
import type { Ticket } from '~/types/admin'
import {
  TICKET_STATUS_OPTIONS,
  TICKET_PRIORITY_OPTIONS,
  TICKET_STATUS,
  TICKET_PRIORITY,
  TICKET_CATEGORY,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'
import { formatDate } from '~/composables/useFormatters'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Тикеты — Админ-панель' })

const router = useRouter()

interface TicketFilters {
  status: string
  priority: string
  assignedToMe: boolean
}

const {
  items: tickets,
  loading,
  filters,
  fetchItems,
} = useAdminList<Ticket, TicketFilters>({
  endpoint: '/api/admin/tickets',
  responseKey: 'tickets',
  initialFilters: { status: 'active', priority: 'all', assignedToMe: false },
  transformParams: (f) => ({
    status: f.status === 'active' ? undefined : f.status,
    priority: f.priority === 'all' ? undefined : f.priority,
    assignedToMe: f.assignedToMe ? 'true' : undefined,
  }),
})

const searchQuery = ref('')
const listContainerRef = ref<HTMLElement | null>(null)
const focusedIndex = ref(-1)
const cardRefs = ref<(HTMLElement | null)[]>([])

function normalizeSearch(s: string): string {
  return s.trim().toLowerCase()
}

function ticketMatchesSearch(item: Ticket, query: string): boolean {
  if (!query) return true
  const q = normalizeSearch(query)
  const subject = (item.subject || '').toLowerCase()
  const number = (item.number || '').toLowerCase()
  const user = ((item.userName || '') + (item.userEmail || '')).toLowerCase()
  return subject.includes(q) || number.includes(q) || user.includes(q)
}

const filteredTickets = computed(() => {
  const query = normalizeSearch(searchQuery.value)
  return query ? tickets.value.filter(t => ticketMatchesSearch(t, searchQuery.value)) : [...tickets.value]
})

const stats = computed(() => {
  const list = tickets.value
  const total = list.length
  const active = list.filter(t => ['new', 'open', 'pending'].includes(t.status)).length
  return { total, active }
})

function goToTicket(ticket: Ticket) {
  router.push(`/tickets/${ticket.id}`)
}

function setCardRef(i: number, el: unknown) {
  if (el) {
    const arr = cardRefs.value
    while (arr.length <= i) arr.push(null)
    const node = el && typeof el === 'object' && '$el' in el ? (el as { $el: HTMLElement }).$el : el
    arr[i] = node as HTMLElement
  }
}

function onListKeydown(e: KeyboardEvent) {
  const list = filteredTickets.value
  if (list.length === 0) return
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      focusedIndex.value = focusedIndex.value < 0 ? 0 : Math.min(focusedIndex.value + 1, list.length - 1)
      nextTick(() => cardRefs.value[focusedIndex.value]?.scrollIntoView({ block: 'nearest' }))
      break
    case 'ArrowUp':
      e.preventDefault()
      focusedIndex.value = focusedIndex.value < 0 ? list.length - 1 : Math.max(focusedIndex.value - 1, 0)
      nextTick(() => cardRefs.value[focusedIndex.value]?.scrollIntoView({ block: 'nearest' }))
      break
    case 'Enter':
      e.preventDefault()
      if (focusedIndex.value >= 0) goToTicket(list[focusedIndex.value]!)
      break
    default:
      break
  }
}

function onCardClick(ticket: Ticket, index: number) {
  focusedIndex.value = index
  goToTicket(ticket)
}

watch(filteredTickets, (list) => {
  if (focusedIndex.value >= 0) {
    focusedIndex.value = Math.min(focusedIndex.value, Math.max(0, list.length - 1))
  }
})
</script>

<template>
  <div class="tickets-page">
    <header class="tickets-page__hero">
      <div class="tickets-page__hero-bg" aria-hidden="true" />
      <div class="tickets-page__hero-inner">
        <div class="flex items-center gap-3 mb-2">
          <div class="tickets-page__hero-icon">
            <Icon name="heroicons:ticket" class="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 class="tickets-page__hero-title">Тикеты</h1>
            <p class="tickets-page__hero-subtitle">Обращения и поддержка</p>
          </div>
        </div>
        <div v-if="!loading" class="tickets-page__stats">
          <span class="tickets-page__stat"><strong>{{ stats.total }}</strong> тикетов</span>
          <span v-if="stats.active > 0" class="tickets-page__stat tickets-page__stat--active">
            <span class="tickets-page__stat-dot" />
            <strong>{{ stats.active }}</strong> в работе
          </span>
        </div>
      </div>
    </header>

    <div class="tickets-page__toolbar">
      <nav class="tickets-page__nav" aria-label="Фильтр по статусу">
        <button
          v-for="opt in TICKET_STATUS_OPTIONS"
          :key="opt.value"
          type="button"
          class="tickets-page__nav-item"
          :class="{ 'tickets-page__nav-item--active': filters.status === opt.value }"
          @click="filters.status = opt.value"
        >
          {{ opt.label }}
        </button>
      </nav>
      <div class="tickets-page__bar-row">
        <div class="tickets-page__block tickets-page__block--search">
          <Icon name="heroicons:magnifying-glass" class="tickets-page__block-search-icon" aria-hidden="true" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Поиск по номеру или теме..."
            class="tickets-page__block-search"
            aria-label="Поиск тикетов"
          />
        </div>
        <div class="tickets-page__block tickets-page__block--priority">
          <UiSelect
            v-model="filters.priority"
            :options="TICKET_PRIORITY_OPTIONS.map(o => ({ value: o.value, label: o.label }))"
            placeholder="Приоритет"
            size="md"
            class="tickets-page__block-select"
          />
        </div>
        <label class="tickets-page__toggle-wrap">
          <input v-model="filters.assignedToMe" type="checkbox" class="tickets-page__toggle-input">
          <span class="tickets-page__toggle-label">Только мои</span>
        </label>
      </div>
    </div>

    <UiLoading v-if="loading" class="tickets-page__loading" />

    <div
      v-else
      ref="listContainerRef"
      tabindex="0"
      role="list"
      aria-label="Список тикетов"
      class="tickets-page__list outline-none"
      @keydown="onListKeydown"
    >
      <article
        v-for="(ticket, i) in filteredTickets"
        :key="ticket.id"
        :ref="(el) => setCardRef(i, el)"
        class="tickets-page__card"
        :class="{ 'tickets-page__card--focused': i === focusedIndex }"
        tabindex="-1"
        @click="onCardClick(ticket, i)"
      >
        <div class="tickets-page__card-number">
          {{ ticket.number }}
        </div>
        <div class="tickets-page__card-body">
          <div class="tickets-page__card-top">
            <span class="tickets-page__card-subject">{{ ticket.subject }}</span>
            <UiBadge
              :class="getStatusBadgeClass(TICKET_STATUS, ticket.status)"
              size="sm"
            >
              {{ getStatusLabel(TICKET_STATUS, ticket.status) }}
            </UiBadge>
          </div>
          <p class="tickets-page__card-user">
            {{ ticket.userName || `Пользователь #${ticket.userId}` }}
            <span v-if="ticket.userEmail" class="tickets-page__card-email"> · {{ ticket.userEmail }}</span>
          </p>
          <div class="tickets-page__card-meta">
            <UiBadge
              :class="getStatusBadgeClass(TICKET_PRIORITY, ticket.priority)"
              size="sm"
            >
              {{ getStatusLabel(TICKET_PRIORITY, ticket.priority) }}
            </UiBadge>
            <UiBadge
              :class="getStatusBadgeClass(TICKET_CATEGORY, ticket.category)"
              size="sm"
            >
              {{ getStatusLabel(TICKET_CATEGORY, ticket.category) }}
            </UiBadge>
            <span v-if="ticket.assignedAdmin" class="tickets-page__card-assigned">
              Назначен: {{ ticket.assignedAdmin.fullName }}
            </span>
            <span class="tickets-page__card-date">
              {{ formatDate(ticket.createdAt) }}
            </span>
          </div>
        </div>
        <Icon name="heroicons:chevron-right" class="tickets-page__card-arrow" />
      </article>

      <div
        v-if="filteredTickets.length === 0"
        class="tickets-page__empty"
      >
        <Icon name="heroicons:ticket" class="tickets-page__empty-icon" />
        <h2 class="tickets-page__empty-title">
          {{ searchQuery.trim() ? 'Ничего не найдено' : (filters.status === 'active' ? 'Тикетов пока нет' : 'Нет тикетов с этим статусом') }}
        </h2>
        <p class="tickets-page__empty-text">
          {{ searchQuery.trim() ? 'Попробуйте другой запрос или сбросьте фильтры' : 'Обращения появятся здесь' }}
        </p>
      </div>
    </div>
  </div>
</template>
