<script setup lang="ts">
import type { ConnectionRequest, CallbackRequest } from '~/types/admin'

definePageMeta({
  middleware: 'admin'
})

useHead({ title: 'Заявки — Админ-панель' })

const toast = useToast()

// Tab state
const activeTab = ref<'connection' | 'callback'>('connection')

// ==================== CONNECTION REQUESTS ====================
const connectionLoading = ref(true)
const connectionRequests = ref<ConnectionRequest[]>([])
const connectionStatusFilter = ref<string>('new')
const onlyInCoverage = ref(false)

const fetchConnectionRequests = async () => {
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
  } catch (error) {
    console.error('Failed to fetch connection requests:', error)
    toast.error('Не удалось загрузить заявки на подключение')
  } finally {
    connectionLoading.value = false
  }
}

// ==================== CALLBACK REQUESTS ====================
const callbackLoading = ref(true)
const callbackRequests = ref<CallbackRequest[]>([])
const callbackStatusFilter = ref<string>('new')

const fetchCallbackRequests = async () => {
  callbackLoading.value = true
  try {
    const params = new URLSearchParams()
    if (callbackStatusFilter.value !== 'all') {
      params.set('status', callbackStatusFilter.value)
    }

    const data = await $fetch<{ callbacks: CallbackRequest[] }>(`/api/admin/callbacks?${params}`)
    callbackRequests.value = data.callbacks
  } catch (error) {
    console.error('Failed to fetch callback requests:', error)
    toast.error('Не удалось загрузить заявки на обратный звонок')
  } finally {
    callbackLoading.value = false
  }
}

const updateCallbackStatus = async (callback: CallbackRequest, newStatus: string) => {
  try {
    await $fetch(`/api/admin/callbacks/${callback.id}`, {
      method: 'PUT',
      body: { status: newStatus }
    })
    callback.status = newStatus as CallbackRequest['status']
    toast.success('Статус заявки обновлён')
  } catch (error) {
    console.error('Failed to update callback status:', error)
    toast.error('Не удалось обновить статус заявки')
  }
}

// Counters for new requests
const newConnectionCount = computed(() =>
  connectionRequests.value.filter(r => r.status === 'new').length
)
const newCallbackCount = computed(() =>
  callbackRequests.value.filter(r => r.status === 'new').length
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
  } else if (newTab === 'callback' && callbackRequests.value.length === 0) {
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
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        :class="activeTab === 'connection'
          ? 'bg-primary text-white'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'"
        :style="activeTab !== 'connection' ? 'background: var(--glass-bg);' : ''"
        @click="activeTab = 'connection'"
      >
        <Icon name="heroicons:home" class="w-4 h-4" />
        Подключение
        <span
          v-if="newConnectionCount > 0"
          class="px-1.5 py-0.5 text-xs rounded-full"
          :class="activeTab === 'connection' ? 'bg-white/20' : 'bg-primary/20 text-primary'"
        >
          {{ newConnectionCount }}
        </span>
      </button>
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        :class="activeTab === 'callback'
          ? 'bg-primary text-white'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'"
        :style="activeTab !== 'callback' ? 'background: var(--glass-bg);' : ''"
        @click="activeTab = 'callback'"
      >
        <Icon name="heroicons:phone" class="w-4 h-4" />
        Обратный звонок
        <span
          v-if="newCallbackCount > 0"
          class="px-1.5 py-0.5 text-xs rounded-full"
          :class="activeTab === 'callback' ? 'bg-white/20' : 'bg-primary/20 text-primary'"
        >
          {{ newCallbackCount }}
        </span>
      </button>
    </div>

    <!-- CONNECTION TAB -->
    <RequestsConnectionRequestsTab
      v-show="activeTab === 'connection'"
      :requests="connectionRequests"
      :loading="connectionLoading"
      v-model:status-filter="connectionStatusFilter"
      v-model:only-in-coverage="onlyInCoverage"
    />

    <!-- CALLBACK TAB -->
    <RequestsCallbackRequestsTab
      v-show="activeTab === 'callback'"
      :requests="callbackRequests"
      :loading="callbackLoading"
      v-model:status-filter="callbackStatusFilter"
      @update-status="updateCallbackStatus"
    />
  </div>
</template>
