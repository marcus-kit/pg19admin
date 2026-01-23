<script setup lang="ts">
import type { ConnectionRequest } from '~/types/admin'
import {
  CONNECTION_REQUEST_STATUS,
  CONNECTION_STATUS_OPTIONS,
  REQUEST_SOURCE,
  getStatusLabel,
  getStatusBadgeClass
} from '~/composables/useStatusConfig'

interface Props {
  requests: ConnectionRequest[]
  loading: boolean
  statusFilter: string
  onlyInCoverage: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:statusFilter': [value: string]
  'update:onlyInCoverage': [value: boolean]
}>()

const { formatPhone, formatDateTime } = useFormatters()

const goToRequest = (id: string) => {
  navigateTo(`/requests/${id}`)
}

const localStatusFilter = computed({
  get: () => props.statusFilter,
  set: (value: string) => emit('update:statusFilter', value)
})

const localOnlyInCoverage = computed({
  get: () => props.onlyInCoverage,
  set: (value: boolean) => emit('update:onlyInCoverage', value)
})
</script>

<template>
  <div>
    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <div class="flex gap-2 flex-wrap">
        <UiButton
          v-for="opt in CONNECTION_STATUS_OPTIONS"
          :key="opt.value"
          variant="ghost"
          size="sm"
          :class="{ 'bg-primary/20': localStatusFilter === opt.value }"
          @click="localStatusFilter = opt.value"
        >
          {{ opt.label }}
        </UiButton>
      </div>

      <div class="flex items-center gap-2 ml-auto">
        <input
          id="onlyInCoverage"
          v-model="localOnlyInCoverage"
          type="checkbox"
          class="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary"
        />
        <label for="onlyInCoverage" class="text-sm text-[var(--text-secondary)] cursor-pointer">
          В зоне покрытия
        </label>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Requests List -->
    <div v-else class="space-y-3">
      <div
        v-for="request in requests"
        :key="request.id"
        class="glass-card p-4 rounded-lg cursor-pointer hover:border-primary/50 transition-all group"
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
              class="w-5 h-5 text-[var(--text-muted)] group-hover:text-primary transition-colors"
            />
          </div>
        </div>
      </div>

      <div v-if="requests.length === 0" class="text-center py-12">
        <Icon name="heroicons:clipboard-document-list" class="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
        <p class="text-[var(--text-muted)]">
          {{ statusFilter === 'all' ? 'Заявок на подключение пока нет' : 'Нет заявок с таким статусом' }}
        </p>
      </div>
    </div>
  </div>
</template>
