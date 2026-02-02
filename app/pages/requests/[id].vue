<script setup lang="ts">
import { formatDateTime, formatPhone } from '~/composables/useFormatters'
import {
  CONNECTION_REQUEST_STATUS,
  REQUEST_SOURCE,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'

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

const loading = ref(true)
const saving = ref(false)
const request = ref<ConnectionRequest | null>(null)
const selectedStatus = ref<string>('')

const requestId = computed(() => route.params.id as string)

const statusOptions = [
  { value: 'new', label: 'Новая' },
  { value: 'contacted', label: 'Связались' },
  { value: 'approved', label: 'Одобрена' },
  { value: 'rejected', label: 'Отклонена' },
  { value: 'completed', label: 'Выполнена' },
]

const showMapModal = ref(false)

const mapUrl = computed(() => {
  if (!request.value?.latitude || !request.value?.longitude) return null
  const lat = request.value.latitude
  const lon = request.value.longitude
  return `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=16&size=600,300&l=map&pt=${lon},${lat},pm2rdm`
})

const mapUrlLarge = computed(() => {
  if (!request.value?.latitude || !request.value?.longitude) return null
  const lat = request.value.latitude
  const lon = request.value.longitude
  return `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=16&size=1200,800&l=map&pt=${lon},${lat},pm2rdm`
})

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

function cancel() {
  router.push('/requests/connection')
}

onMounted(() => {
  fetchRequest()
})
</script>

<template>
  <div class="request-detail-page">
    <header class="request-detail-page__hero">
      <div class="request-detail-page__hero-bg" aria-hidden="true" />
      <div class="request-detail-page__hero-inner">
        <div class="request-detail-page__hero-row">
          <button type="button" class="request-detail-page__back" aria-label="Назад" @click="cancel">
            <Icon name="heroicons:arrow-left" class="w-5 h-5" />
          </button>
          <div class="request-detail-page__hero-head">
            <div class="request-detail-page__hero-icon">
              <Icon name="heroicons:clipboard-document-list" class="w-7 h-7 text-primary" />
            </div>
            <div class="request-detail-page__hero-title-wrap">
              <h1 class="request-detail-page__hero-title">
                {{ request ? request.fullName : 'Заявка' }}
              </h1>
              <p class="request-detail-page__hero-subtitle">
                {{ request ? `Заявка #${request.id} · Подключение` : 'Заявка на подключение' }}
              </p>
            </div>
          </div>
          <a
            v-if="request"
            :href="`tel:${request.phone}`"
            class="request-detail-page__btn-call"
          >
            <Icon name="heroicons:phone" class="w-5 h-5" />
            <span>Позвонить</span>
          </a>
        </div>
        <div v-if="request" class="request-detail-page__hero-badges">
          <UiBadge :class="getStatusBadgeClass(CONNECTION_REQUEST_STATUS, request.status)" size="sm">
            {{ getStatusLabel(CONNECTION_REQUEST_STATUS, request.status) }}
          </UiBadge>
          <UiBadge
            v-if="request.inCoverageZone"
            class="request-detail-page__badge--in-coverage"
            size="sm"
          >
            <Icon name="heroicons:check" class="w-3 h-3 mr-1" />
            В зоне покрытия
          </UiBadge>
          <UiBadge
            v-else
            class="request-detail-page__badge--out-coverage"
            size="sm"
          >
            <Icon name="heroicons:exclamation-triangle" class="w-3 h-3 mr-1" />
            Вне зоны покрытия
          </UiBadge>
        </div>
      </div>
    </header>

    <UiLoading v-if="loading" class="request-detail-page__loading" />

    <template v-else-if="request">
      <div class="request-detail-page__grid">
        <!-- Контактные данные -->
        <section class="request-detail-page__card glass-card glass-card-static">
          <h2 class="request-detail-page__card-title">Контактные данные</h2>
          <dl class="request-detail-page__dl">
            <div class="request-detail-page__row">
              <dt class="request-detail-page__dt">Имя</dt>
              <dd class="request-detail-page__dd">{{ request.fullName }}</dd>
            </div>
            <div class="request-detail-page__row">
              <dt class="request-detail-page__dt">Телефон</dt>
              <dd class="request-detail-page__dd">
                <a :href="`tel:${request.phone}`" class="request-detail-page__link">
                  {{ formatPhone(request.phone) }}
                </a>
              </dd>
            </div>
            <div class="request-detail-page__row">
              <dt class="request-detail-page__dt">Адрес</dt>
              <dd class="request-detail-page__dd">{{ request.addressText || '—' }}</dd>
            </div>
          </dl>
        </section>

        <!-- Изменить статус -->
        <section class="request-detail-page__card glass-card glass-card-static">
          <h2 class="request-detail-page__card-title">Изменить статус</h2>
          <div class="request-detail-page__status-form">
            <UiSelect
              v-model="selectedStatus"
              :options="statusOptions"
              label="Статус заявки"
            />
            <UiButton
              :disabled="saving || selectedStatus === request.status"
              :loading="saving"
              class="request-detail-page__save-btn"
              @click="updateStatus"
            >
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
            </UiButton>
          </div>
        </section>

        <!-- Карта -->
        <section v-if="mapUrl" class="request-detail-page__card glass-card glass-card-static">
          <h2 class="request-detail-page__card-title">Местоположение</h2>
          <button
            type="button"
            class="request-detail-page__map-wrap request-detail-page__map-wrap--clickable"
            @click="showMapModal = true"
          >
            <img
              :src="mapUrl"
              :alt="`Карта: ${request.addressText}`"
              class="request-detail-page__map-img"
            />
          </button>
          <p class="request-detail-page__map-coords">
            Координаты: {{ request.latitude }}, {{ request.longitude }}
            <span class="request-detail-page__map-hint">· Нажмите на карту для увеличения</span>
          </p>
        </section>

        <!-- Дополнительная информация -->
        <section class="request-detail-page__card glass-card glass-card-static">
          <h2 class="request-detail-page__card-title">Дополнительная информация</h2>
          <dl class="request-detail-page__dl request-detail-page__dl--grid">
            <div class="request-detail-page__row">
              <dt class="request-detail-page__dt">Источник</dt>
              <dd class="request-detail-page__dd">{{ getStatusLabel(REQUEST_SOURCE, request.source) }}</dd>
            </div>
            <div class="request-detail-page__row">
              <dt class="request-detail-page__dt">Дата создания</dt>
              <dd class="request-detail-page__dd">{{ formatDateTime(request.createdAt) }}</dd>
            </div>
            <div class="request-detail-page__row">
              <dt class="request-detail-page__dt">Последнее обновление</dt>
              <dd class="request-detail-page__dd">{{ formatDateTime(request.updatedAt) }}</dd>
            </div>
            <div v-if="request.metadata?.ip" class="request-detail-page__row">
              <dt class="request-detail-page__dt">IP адрес</dt>
              <dd class="request-detail-page__dd">
                <span class="request-detail-page__mono">{{ (request.metadata as { ip?: string }).ip }}</span>
              </dd>
            </div>
          </dl>

          <div v-if="request.addressComponents" class="request-detail-page__address-components">
            <h3 class="request-detail-page__subtitle">Компоненты адреса</h3>
            <dl class="request-detail-page__dl request-detail-page__dl--grid request-detail-page__dl--sm">
              <div v-if="(request.addressComponents as Record<string, unknown>).region" class="request-detail-page__row">
                <dt class="request-detail-page__dt">Регион</dt>
                <dd class="request-detail-page__dd">{{ (request.addressComponents as Record<string, string>).region }}</dd>
              </div>
              <div v-if="(request.addressComponents as Record<string, unknown>).city" class="request-detail-page__row">
                <dt class="request-detail-page__dt">Город</dt>
                <dd class="request-detail-page__dd">{{ (request.addressComponents as Record<string, string>).city }}</dd>
              </div>
              <div v-if="(request.addressComponents as Record<string, unknown>).street" class="request-detail-page__row">
                <dt class="request-detail-page__dt">Улица</dt>
                <dd class="request-detail-page__dd">{{ (request.addressComponents as Record<string, string>).street }}</dd>
              </div>
              <div v-if="(request.addressComponents as Record<string, unknown>).house" class="request-detail-page__row">
                <dt class="request-detail-page__dt">Дом</dt>
                <dd class="request-detail-page__dd">{{ (request.addressComponents as Record<string, string>).house }}</dd>
              </div>
              <div v-if="(request.addressComponents as Record<string, unknown>).flat" class="request-detail-page__row">
                <dt class="request-detail-page__dt">Квартира</dt>
                <dd class="request-detail-page__dd">{{ (request.addressComponents as Record<string, string>).flat }}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      <!-- Модальное окно карты -->
      <Teleport to="body">
        <div
          v-if="showMapModal && mapUrlLarge"
          class="request-detail-page__map-modal"
          @click.self="showMapModal = false"
        >
          <div class="request-detail-page__map-modal-backdrop" />
          <div class="request-detail-page__map-modal-inner">
            <button
              type="button"
              class="request-detail-page__map-modal-close"
              aria-label="Закрыть"
              @click="showMapModal = false"
            >
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
            <img
              :src="mapUrlLarge"
              :alt="`Карта: ${request.addressText}`"
              class="request-detail-page__map-modal-img"
              @click.stop
            />
            <p class="request-detail-page__map-modal-coords">
              {{ request.addressText || '—' }} · {{ request.latitude }}, {{ request.longitude }}
            </p>
          </div>
        </div>
      </Teleport>
    </template>
  </div>
</template>
