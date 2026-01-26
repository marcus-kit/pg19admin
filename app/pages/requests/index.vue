<script setup lang="ts">
import type { ConnectionRequest, CallbackRequest } from '~/types/admin'
import {
  CONNECTION_REQUEST_STATUS,
  CONNECTION_STATUS_OPTIONS,
  CALLBACK_REQUEST_STATUS,
  CALLBACK_STATUS_OPTIONS,
  REQUEST_SOURCE,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Заявки — Админ-панель' })

const toast = useToast()
const { formatPhone, formatDateTime } = useFormatters()

// Активная вкладка
const activeTab = ref<'connection' | 'callback'>('connection')

// ==================== ЗАЯВКИ НА ПОДКЛЮЧЕНИЕ ====================
const connectionLoading = ref(true) // Загрузка списка
const connectionRequests = ref<ConnectionRequest[]>([]) // Список заявок
const connectionStatusFilter = ref<string>('new') // Фильтр по статусу
const onlyInCoverage = ref(false) // Фильтр "только в зоне покрытия"

// Загрузка заявок на подключение
async function fetchConnectionRequests() {
  connectionLoading.value = true
  try {
    const params = new URLSearchParams()
    if (connectionStatusFilter.value !== 'all') {
      params.set('status', connectionStatusFilter.value)
    }
    if (onlyInCoverage.value) {
      params.set('inCoverage', 'true')
    }

    const data = await $fetch<{ requests: ConnectionRequest[] }>(`/api/admin/requests?${params}`)
    connectionRequests.value = data.requests
  }
  catch {
    toast.error('Не удалось загрузить заявки на подключение')
  }
  finally {
    connectionLoading.value = false
  }
}

// ==================== ЗАЯВКИ НА ОБРАТНЫЙ ЗВОНОК ====================
const callbackLoading = ref(true) // Загрузка списка
const callbackRequests = ref<CallbackRequest[]>([]) // Список заявок
const callbackStatusFilter = ref<string>('new') // Фильтр по статусу

// Загрузка заявок на обратный звонок
async function fetchCallbackRequests() {
  callbackLoading.value = true
  try {
    const params = new URLSearchParams()
    if (callbackStatusFilter.value !== 'all') {
      params.set('status', callbackStatusFilter.value)
    }

    const data = await $fetch<{ callbacks: CallbackRequest[] }>(`/api/admin/callbacks?${params}`)
    callbackRequests.value = data.callbacks
  }
  catch {
    toast.error('Не удалось загрузить заявки на обратный звонок')
  }
  finally {
    callbackLoading.value = false
  }
}

// Обновление статуса заявки на звонок
async function updateCallbackStatus(callback: CallbackRequest, newStatus: string) {
  try {
    await $fetch(`/api/admin/callbacks/${callback.id}`, {
      method: 'PUT',
      body: { status: newStatus },
    })
    callback.status = newStatus as CallbackRequest['status']
    toast.success('Статус заявки обновлён')
  }
  catch {
    toast.error('Не удалось обновить статус заявки')
  }
}

// Счётчики новых заявок для отображения в табах
const newConnectionCount = computed(() =>
  connectionRequests.value.filter(r => r.status === 'new').length,
)
const newCallbackCount = computed(() =>
  callbackRequests.value.filter(r => r.status === 'new').length,
)

// ==================== LIFECYCLE ====================
onMounted(() => {
  fetchConnectionRequests()
  fetchCallbackRequests()
})

watch([connectionStatusFilter, onlyInCoverage], () => {
  if (activeTab.value === 'connection') {
    fetchConnectionRequests()
  }
})

watch(callbackStatusFilter, () => {
  if (activeTab.value === 'callback') {
    fetchCallbackRequests()
  }
})

watch(activeTab, (newTab) => {
  if (newTab === 'connection' && connectionRequests.value.length === 0) {
    fetchConnectionRequests()
  }
  else if (newTab === 'callback' && callbackRequests.value.length === 0) {
    fetchCallbackRequests()
  }
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <h1 class="text-3xl font-bold text-[var(--text-primary)]">
        Заявки
      </h1>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6">
      <button
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
          activeTab === 'connection'
            ? 'bg-primary text-white'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] glass-card',
        ]"
        @click="activeTab = 'connection'"
      >
        <Icon name="heroicons:home" class="w-4 h-4" />
        Подключение
        <span
          v-if="newConnectionCount > 0"
          :class="activeTab === 'connection' ? 'bg-white/20' : 'bg-primary/20 text-primary'"
          class="px-1.5 py-0.5 text-xs rounded-full"
        >
          {{ newConnectionCount }}
        </span>
      </button>
      <button
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
          activeTab === 'callback'
            ? 'bg-primary text-white'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] glass-card',
        ]"
        @click="activeTab = 'callback'"
      >
        <Icon name="heroicons:phone" class="w-4 h-4" />
        Обратный звонок
        <span
          v-if="newCallbackCount > 0"
          :class="activeTab === 'callback' ? 'bg-white/20' : 'bg-primary/20 text-primary'"
          class="px-1.5 py-0.5 text-xs rounded-full"
        >
          {{ newCallbackCount }}
        </span>
      </button>
    </div>

    <!-- CONNECTION TAB (бывший ConnectionRequestsTab) -->
    <div v-show="activeTab === 'connection'">
      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-6">
        <div class="flex gap-2 flex-wrap">
          <UiButton
            v-for="opt in CONNECTION_STATUS_OPTIONS"
            :key="opt.value"
            :class="{ 'bg-primary/20': connectionStatusFilter === opt.value }"
            @click="connectionStatusFilter = opt.value"
            variant="ghost"
            size="sm"
          >
            {{ opt.label }}
          </UiButton>
        </div>

        <div class="flex items-center gap-2 ml-auto">
          <input
            v-model="onlyInCoverage"
            id="onlyInCoverage"
            type="checkbox"
            class="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary"
          />
          <label for="onlyInCoverage" class="text-sm text-[var(--text-secondary)] cursor-pointer">
            В зоне покрытия
          </label>
        </div>
      </div>

      <!-- Loading -->
      <UiLoading v-if="connectionLoading" />

      <!-- Requests List -->
      <div v-else class="space-y-3">
        <UiCard
          v-for="request in connectionRequests"
          :key="request.id"
          :hover="true"
          @click="goToRequest(request.id)"
          padding="sm"
          class="cursor-pointer"
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

        <UiEmptyState
          v-if="connectionRequests.length === 0"
          :title="connectionStatusFilter === 'all' ? 'Заявок на подключение пока нет' : 'Нет заявок с таким статусом'"
          icon="heroicons:clipboard-document-list"
        />
      </div>
    </div>

    <!-- CALLBACK TAB (бывший CallbackRequestsTab) -->
    <div v-show="activeTab === 'callback'">
      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-6">
        <div class="flex gap-2 flex-wrap">
          <UiButton
            v-for="opt in CALLBACK_STATUS_OPTIONS"
            :key="opt.value"
            :class="{ 'bg-primary/20': callbackStatusFilter === opt.value }"
            @click="callbackStatusFilter = opt.value"
            variant="ghost"
            size="sm"
          >
            {{ opt.label }}
          </UiButton>
        </div>
      </div>

      <!-- Loading -->
      <UiLoading v-if="callbackLoading" />

      <!-- Requests List -->
      <div v-else class="space-y-3">
        <UiCard
          v-for="callback in callbackRequests"
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
                  @click.stop
                  class="text-sm text-primary hover:underline"
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
                @click.stop
                class="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
                title="Позвонить"
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
                    @click="updateCallbackStatus(callback, opt.value)"
                    class="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-colors"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </UiCard>

        <UiEmptyState
          v-if="callbackRequests.length === 0"
          :title="callbackStatusFilter === 'all' ? 'Заявок на звонок пока нет' : 'Нет заявок с таким статусом'"
          icon="heroicons:phone-x-mark"
        />
      </div>
    </div>
  </div>
</template>
