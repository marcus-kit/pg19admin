<script setup lang="ts">
import { formatDateTime, formatPhone } from '~/composables/useFormatters'
import {
  CONNECTION_REQUEST_STATUS,
  REQUEST_SOURCE,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'

// Интерфейс заявки на подключение
interface ConnectionRequest {
  id: number
  fullName: string
  phone: string
  addressText: string
  addressComponents: Record<string, unknown> | null
  latitude: number
  longitude: number
  inCoverageZone: boolean
  coverageZoneId: number | null
  status: 'new' | 'contacted' | 'approved' | 'rejected' | 'completed'
  source: string
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

definePageMeta({
  middleware: 'admin',
})

const toast = useToast()
const route = useRoute()
const router = useRouter()

useHead({
  title: computed(() => request.value ? `Заявка #${request.value.id} — Админ-панель` : 'Заявка — Админ-панель'),
})

// Состояние страницы
const loading = ref(true) // Загрузка данных
const saving = ref(false) // Сохранение изменений
const request = ref<ConnectionRequest | null>(null) // Данные заявки
const selectedStatus = ref<string>('') // Выбранный статус

const requestId = computed(() => route.params.id as string)

// Опции статуса заявки
const statusOptions = [
  { value: 'new', label: 'Новая' },
  { value: 'contacted', label: 'Связались' },
  { value: 'approved', label: 'Одобрена' },
  { value: 'rejected', label: 'Отклонена' },
  { value: 'completed', label: 'Выполнена' },
]

// URL для статической карты Яндекс
const mapUrl = computed(() => {
  if (!request.value?.latitude || !request.value?.longitude) return null
  const lat = request.value.latitude
  const lon = request.value.longitude
  return `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=16&size=600,300&l=map&pt=${lon},${lat},pm2rdm`
})

// Загрузка данных заявки
async function fetchRequest() {
  loading.value = true
  try {
    const data = await $fetch<{ request: ConnectionRequest }>(`/api/admin/requests/${requestId.value}`)
    request.value = data.request
    selectedStatus.value = data.request.status
  }
  catch {
    toast.error('Не удалось загрузить заявку')
    router.push('/requests')
  }
  finally {
    loading.value = false
  }
}

// Обновление статуса заявки
async function updateStatus() {
  if (!request.value || selectedStatus.value === request.value.status) return

  saving.value = true
  try {
    await $fetch(`/api/admin/requests/${requestId.value}`, {
      method: 'PUT',
      body: { status: selectedStatus.value },
    })
    request.value.status = selectedStatus.value as ConnectionRequest['status']
    toast.success('Статус заявки обновлён')
  }
  catch {
    toast.error('Не удалось обновить статус заявки')
    selectedStatus.value = request.value.status
  }
  finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchRequest()
})
</script>

<template>
  <div>
    <!-- Back button -->
    <div class="mb-6">
      <UiButton variant="ghost" @click="router.push('/requests')">
        <Icon name="heroicons:arrow-left" class="w-4 h-4 mr-2" />
        Назад к списку
      </UiButton>
    </div>

    <!-- Loading -->
    <UiLoading v-if="loading" />

    <!-- Content -->
    <div v-else-if="request" class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-[var(--text-primary)] mb-2">
            Заявка #{{ request.id }}
          </h1>
          <div class="flex items-center gap-3">
            <UiBadge :class="getStatusBadgeClass(CONNECTION_REQUEST_STATUS, request.status)" size="sm">
              {{ getStatusLabel(CONNECTION_REQUEST_STATUS, request.status) }}
            </UiBadge>
            <UiBadge
              v-if="request.inCoverageZone"
              class="bg-green-500/20 text-green-400"
              size="sm"
            >
              <Icon name="heroicons:check" class="w-3 h-3 mr-1" />
              В зоне покрытия
            </UiBadge>
            <UiBadge
              v-else
              class="bg-orange-500/20 text-orange-400"
              size="sm"
            >
              <Icon name="heroicons:exclamation-triangle" class="w-3 h-3 mr-1" />
              Вне зоны покрытия
            </UiBadge>
          </div>
        </div>

        <!-- Call button -->
        <a
          :href="`tel:${request.phone}`"
          class="btn-primary px-6 py-3 inline-flex items-center gap-2"
        >
          <Icon name="heroicons:phone" class="w-5 h-5" />
          <span>Позвонить</span>
        </a>
      </div>

      <!-- Main info -->
      <div class="grid md:grid-cols-2 gap-6">
        <!-- Contact info -->
        <UiCard>
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Контактные данные
          </h3>
          <dl class="space-y-3">
            <div>
              <dt class="text-sm text-[var(--text-muted)]">Имя</dt>
              <dd class="text-[var(--text-primary)] font-medium">{{ request.fullName }}</dd>
            </div>
            <div>
              <dt class="text-sm text-[var(--text-muted)]">Телефон</dt>
              <dd class="text-[var(--text-primary)] font-medium">
                <a :href="`tel:${request.phone}`" class="text-primary hover:underline">
                  {{ formatPhone(request.phone) }}
                </a>
              </dd>
            </div>
            <div>
              <dt class="text-sm text-[var(--text-muted)]">Адрес</dt>
              <dd class="text-[var(--text-primary)]">{{ request.addressText }}</dd>
            </div>
          </dl>
        </UiCard>

        <!-- Status change -->
        <UiCard>
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Изменить статус
          </h3>
          <div class="space-y-4">
            <UiSelect
              v-model="selectedStatus"
              :options="statusOptions"
              label="Статус заявки"
            />
            <UiButton
              :disabled="saving || selectedStatus === request.status"
              :loading="saving"
              class="w-full"
              @click="updateStatus"
            >
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
            </UiButton>
          </div>
        </UiCard>
      </div>

      <!-- Map -->
      <UiCard v-if="mapUrl">
        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Местоположение
        </h3>
        <div class="rounded-lg overflow-hidden">
          <img
            :src="mapUrl"
            :alt="`Карта: ${request.addressText}`"
            class="w-full h-auto"
          />
        </div>
        <p class="text-sm text-[var(--text-muted)] mt-2">
          Координаты: {{ request.latitude }}, {{ request.longitude }}
        </p>
      </UiCard>

      <!-- Metadata -->
      <UiCard>
        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Дополнительная информация
        </h3>
        <dl class="grid md:grid-cols-2 gap-4">
          <div>
            <dt class="text-sm text-[var(--text-muted)]">Источник</dt>
            <dd class="text-[var(--text-primary)]">{{ getStatusLabel(REQUEST_SOURCE, request.source) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-[var(--text-muted)]">Дата создания</dt>
            <dd class="text-[var(--text-primary)]">{{ formatDateTime(request.createdAt) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-[var(--text-muted)]">Последнее обновление</dt>
            <dd class="text-[var(--text-primary)]">{{ formatDateTime(request.updatedAt) }}</dd>
          </div>
          <div v-if="request.metadata?.ip">
            <dt class="text-sm text-[var(--text-muted)]">IP адрес</dt>
            <dd class="text-[var(--text-primary)] font-mono text-sm">{{ request.metadata.ip }}</dd>
          </div>
        </dl>

        <!-- Address components (if available) -->
        <div v-if="request.addressComponents" class="mt-6">
          <h4 class="text-sm font-medium text-[var(--text-muted)] mb-2">Компоненты адреса</h4>
          <dl class="grid md:grid-cols-3 gap-2 text-sm">
            <div v-if="request.addressComponents.region">
              <dt class="text-[var(--text-muted)]">Регион</dt>
              <dd class="text-[var(--text-primary)]">{{ request.addressComponents.region }}</dd>
            </div>
            <div v-if="request.addressComponents.city">
              <dt class="text-[var(--text-muted)]">Город</dt>
              <dd class="text-[var(--text-primary)]">{{ request.addressComponents.city }}</dd>
            </div>
            <div v-if="request.addressComponents.street">
              <dt class="text-[var(--text-muted)]">Улица</dt>
              <dd class="text-[var(--text-primary)]">{{ request.addressComponents.street }}</dd>
            </div>
            <div v-if="request.addressComponents.house">
              <dt class="text-[var(--text-muted)]">Дом</dt>
              <dd class="text-[var(--text-primary)]">{{ request.addressComponents.house }}</dd>
            </div>
            <div v-if="request.addressComponents.flat">
              <dt class="text-[var(--text-muted)]">Квартира</dt>
              <dd class="text-[var(--text-primary)]">{{ request.addressComponents.flat }}</dd>
            </div>
          </dl>
        </div>
      </UiCard>
    </div>
  </div>
</template>
