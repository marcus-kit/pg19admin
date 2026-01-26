<script setup lang="ts">
import type { CallbackRequest } from '~/types/admin'
import {
  CALLBACK_REQUEST_STATUS,
  CALLBACK_STATUS_OPTIONS,
  REQUEST_SOURCE,
  getStatusLabel,
  getStatusBadgeClass,
} from '~/composables/useStatusConfig'

interface Props {
  requests: CallbackRequest[]
  loading: boolean
  statusFilter: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:statusFilter': [value: string]
  'updateStatus': [callback: CallbackRequest, status: string]
}>()

const { formatPhone, formatDateTime } = useFormatters()

const localStatusFilter = computed({
  get: () => props.statusFilter,
  set: (value: string) => emit('update:statusFilter', value),
})

const handleStatusUpdate = (callback: CallbackRequest, status: string) => {
  emit('updateStatus', callback, status)
}
</script>

<template>
  <div>
    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <div class="flex gap-2 flex-wrap">
        <UiButton
          v-for="opt in CALLBACK_STATUS_OPTIONS"
          :key="opt.value"
          :class="{ 'bg-primary/20': localStatusFilter === opt.value }"
          variant="ghost"
          size="sm"
          @click="localStatusFilter = opt.value"
        >
          {{ opt.label }}
        </UiButton>
      </div>
    </div>

    <!-- Loading -->
    <UiLoading v-if="loading" />

    <!-- Requests List -->
    <div v-else class="space-y-3">
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

      <UiEmptyState
        v-if="requests.length === 0"
        :title="statusFilter === 'all' ? 'Заявок на звонок пока нет' : 'Нет заявок с таким статусом'"
        icon="heroicons:phone-x-mark"
      />
    </div>
  </div>
</template>
