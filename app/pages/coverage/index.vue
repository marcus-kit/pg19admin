<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Карта покрытия — Админ-панель' })

const toast = useToast()

interface CoverageZone {
  id: number
  name: string
  description: string | null
  type: 'pg19' | 'partner'
  partnerId: string | null
  partner: { id: string, name: string } | null
  geometry: object
  color: string
  fillOpacity: number
  strokeWidth: number
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

interface Partner {
  id: string
  name: string
  color: string
}

const loading = ref(true)
const zones = ref<CoverageZone[]>([])
const selectedZone = ref<CoverageZone | null>(null)
const selectedPartnerId = ref<string | null>(null)
const showOnlyActive = ref(true)

// Модалка подтверждения удаления
const showDeleteModal = ref(false)
const zoneToDelete = ref<CoverageZone | null>(null)

// Client-side visibility toggle (сохраняется в localStorage)
const hiddenZoneIds = ref<Set<number>>(new Set())

// Загрузка списка партнёров
const partners = ref<Partner[]>([])
const loadingPartners = ref(false)

const fetchPartners = async () => {
  loadingPartners.value = true
  try {
    const data = await $fetch<{ partners: Partner[] }>('/api/admin/partners')
    partners.value = data.partners
  }
  catch (error) {
    console.error('Failed to fetch partners:', error)
    toast.error('Не удалось загрузить список партнёров')
  }
  finally {
    loadingPartners.value = false
  }
}

const selectPartner = (partnerId: string) => {
  if (selectedPartnerId.value === partnerId) {
    // Повторный клик — сбросить выбор
    selectedPartnerId.value = null
  }
  else {
    selectedPartnerId.value = partnerId
  }
}

const filteredZones = computed(() => {
  return zones.value.filter((zone) => {
    // Фильтр по конкретному партнёру
    if (selectedPartnerId.value) {
      if (zone.partnerId !== selectedPartnerId.value) return false
    }
    // Фильтр по активности
    if (showOnlyActive.value && !zone.isActive) {
      return false
    }
    return true
  })
})

// Зоны для отображения на карте (исключая скрытые)
const visibleZonesForMap = computed(() => {
  return filteredZones.value.filter(zone => !hiddenZoneIds.value.has(zone.id))
})

const fetchZones = async () => {
  loading.value = true
  try {
    const data = await $fetch<{ zones: CoverageZone[] }>('/api/admin/coverage/zones')
    zones.value = data.zones
  }
  catch (error) {
    console.error('Failed to fetch zones:', error)
    toast.error('Не удалось загрузить зоны покрытия')
  }
  finally {
    loading.value = false
  }
}

const handleZoneClick = (zone: CoverageZone) => {
  selectedZone.value = zone
}

const handleImport = async (data: { geojson: unknown, type: string, partnerId?: string, replaceExisting: boolean }) => {
  try {
    const result = await $fetch<{ success: boolean, imported: number }>('/api/admin/coverage/import', {
      method: 'POST',
      body: {
        geojson: data.geojson,
        type: data.type,
        partnerId: data.partnerId,
        replaceExisting: data.replaceExisting,
      },
    })

    if (result.success) {
      toast.success(`Импортировано ${result.imported} зон`)
      await fetchZones()
    }
  }
  catch (error: unknown) {
    console.error('Failed to import zones:', error)
    const message = error instanceof Error ? error.message : 'Не удалось импортировать зоны'
    toast.error(message)
  }
}

const handleExport = (query?: string) => {
  // Open export URL in new tab (will trigger download)
  const url = query ? `/api/admin/coverage/export?${query}` : '/api/admin/coverage/export'
  window.open(url, '_blank')
}

// Открытие модалки удаления
const openDeleteModal = (zone: CoverageZone) => {
  zoneToDelete.value = zone
  showDeleteModal.value = true
}

// Подтверждение удаления
const confirmDelete = async () => {
  if (!zoneToDelete.value) return

  const id = zoneToDelete.value.id
  try {
    await $fetch(`/api/admin/coverage/zones/${id}`, { method: 'DELETE' })
    zones.value = zones.value.filter(z => z.id !== id)
    if (selectedZone.value?.id === id) {
      selectedZone.value = null
    }
    showDeleteModal.value = false
    zoneToDelete.value = null
    toast.success('Зона покрытия удалена')
  }
  catch (error: unknown) {
    console.error('Failed to delete zone:', error)
    const message = error instanceof Error ? error.message : 'Не удалось удалить зону'
    toast.error(message)
  }
}

// Toggle visibility (client-side only, сохраняется в localStorage)
const toggleZoneVisibility = (zone: CoverageZone) => {
  const newHidden = new Set(hiddenZoneIds.value)
  if (newHidden.has(zone.id)) {
    newHidden.delete(zone.id)
  }
  else {
    newHidden.add(zone.id)
  }
  hiddenZoneIds.value = newHidden
  // Сохранить в localStorage
  localStorage.setItem('coverage-hidden-zones', JSON.stringify([...newHidden]))
}

// Проверка, скрыта ли зона
const isZoneHidden = (zoneId: number) => hiddenZoneIds.value.has(zoneId)

onMounted(() => {
  // Загрузить скрытые зоны из localStorage
  const saved = localStorage.getItem('coverage-hidden-zones')
  if (saved) {
    try {
      const ids = JSON.parse(saved) as number[]
      hiddenZoneIds.value = new Set(ids)
    }
    catch {
      // Ignore invalid data
    }
  }

  fetchZones()
  fetchPartners()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold text-[var(--text-primary)]">
          Карта покрытия
        </h1>
        <p class="text-[var(--text-muted)] mt-1">
          Управление зонами обслуживания ПЖ19 и партнёров
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Map (2/3 width) -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Filters -->
        <UiCard padding="sm">
          <div class="flex flex-wrap gap-3 items-center">
            <span class="text-sm text-[var(--text-secondary)]">Партнёр:</span>

            <!-- Кнопка "Все" -->
            <UiButton
              :class="{ 'bg-white/10': !selectedPartnerId }"
              variant="ghost"
              size="sm"
              @click="selectedPartnerId = null"
            >
              Все
            </UiButton>

            <!-- Кнопки партнёров -->
            <UiButton
              v-for="partner in partners"
              :key="partner.id"
              :class="{ 'ring-2 ring-offset-1 ring-offset-transparent': selectedPartnerId === partner.id }"
              :style="selectedPartnerId === partner.id ? { ringColor: partner.color } : {}"
              variant="ghost"
              size="sm"
              @click="selectPartner(partner.id)"
            >
              <span
                :style="{ backgroundColor: partner.color }"
                class="w-3 h-3 rounded-full mr-2"
              />
              {{ partner.name }}
            </UiButton>

            <label class="flex items-center gap-2 text-sm text-[var(--text-secondary)] ml-auto cursor-pointer">
              <input
                v-model="showOnlyActive"
                type="checkbox"
                class="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary"
              />
              Только активные
            </label>
          </div>
        </UiCard>

        <!-- Map Component -->
        <ClientOnly>
          <CoverageMap
            :zones="visibleZonesForMap"
            :center="[55.7558, 37.6173]"
            :zoom="10"
            height="500px"
            @zone-click="handleZoneClick"
          />
          <template #fallback>
            <div class="h-[500px] flex items-center justify-center glass-card rounded-xl">
              <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary" />
            </div>
          </template>
        </ClientOnly>

        <!-- Import/Export (под картой) -->
        <CoverageImportExport
          :loading="loading"
          :partners="partners"
          @import="handleImport"
          @export="handleExport"
        />
      </div>

      <!-- Sidebar (1/3 width) -->
      <div class="space-y-4">
        <!-- Zone List -->
        <UiCard>
          <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Зоны ({{ filteredZones.length }})
          </h3>

          <div v-if="loading" class="text-center py-8">
            <Icon name="heroicons:arrow-path" class="w-6 h-6 animate-spin text-primary mx-auto" />
          </div>

          <div v-else class="space-y-2 max-h-[400px] overflow-y-auto">
            <div
              v-for="zone in filteredZones"
              :key="zone.id"
              :class="{
                'ring-2 ring-primary': selectedZone?.id === zone.id,
                'opacity-50': isZoneHidden(zone.id),
              }"
              class="p-3 rounded-lg border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors cursor-pointer"
              @click="handleZoneClick(zone)"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span
                      :style="{ backgroundColor: zone.color }"
                      class="w-3 h-3 rounded-full flex-shrink-0"
                    />
                    <span class="font-medium text-sm text-[var(--text-primary)] truncate">
                      {{ zone.name }}
                    </span>
                  </div>
                  <div class="flex gap-1 flex-wrap">
                    <UiBadge
                      :variant="zone.type === 'pg19' ? 'warning' : 'info'"
                      size="sm"
                    >
                      {{ zone.type === 'pg19' ? 'ПЖ19' : zone.partner?.name || 'Партнёр' }}
                    </UiBadge>
                    <UiBadge
                      v-if="!zone.isActive"
                      size="sm"
                      variant="neutral"
                    >
                      Неактивна
                    </UiBadge>
                    <UiBadge
                      v-if="isZoneHidden(zone.id)"
                      size="sm"
                      variant="neutral"
                    >
                      Скрыта
                    </UiBadge>
                  </div>
                </div>

                <div class="flex gap-1 flex-shrink-0">
                  <button
                    :title="isZoneHidden(zone.id) ? 'Показать на карте' : 'Скрыть на карте'"
                    class="p-1 hover:bg-[var(--glass-bg)] rounded"
                    @click.stop="toggleZoneVisibility(zone)"
                  >
                    <Icon
                      :name="isZoneHidden(zone.id) ? 'heroicons:eye-slash' : 'heroicons:eye'"
                      class="w-4 h-4 text-[var(--text-muted)]"
                    />
                  </button>
                  <button
                    class="p-1 hover:bg-red-500/10 rounded"
                    title="Удалить"
                    @click.stop="openDeleteModal(zone)"
                  >
                    <Icon name="heroicons:trash" class="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>

            <div v-if="filteredZones.length === 0" class="text-center py-8 text-[var(--text-muted)]">
              <Icon name="heroicons:map" class="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Нет зон покрытия</p>
              <p class="text-xs mt-1">Импортируйте GeoJSON файл</p>
            </div>
          </div>
        </UiCard>

        <!-- Selected Zone Details -->
        <UiCard v-if="selectedZone">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-[var(--text-primary)]">
              {{ selectedZone.name }}
            </h3>
            <button
              class="p-1 hover:bg-[var(--glass-bg)] rounded text-[var(--text-muted)]"
              @click="selectedZone = null"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>

          <div class="space-y-3 text-sm">
            <div>
              <span class="text-[var(--text-muted)]">Тип:</span>
              <span class="ml-2 text-[var(--text-primary)]">
                {{ selectedZone.type === 'pg19' ? 'ПЖ19' : 'Партнёр' }}
              </span>
            </div>

            <div v-if="selectedZone.partner">
              <span class="text-[var(--text-muted)]">Партнёр:</span>
              <span class="ml-2 text-[var(--text-primary)]">
                {{ selectedZone.partner.name }}
              </span>
            </div>

            <div v-if="selectedZone.description">
              <span class="text-[var(--text-muted)]">Описание:</span>
              <p class="mt-1 text-[var(--text-secondary)]">
                {{ selectedZone.description }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-[var(--text-muted)]">Цвет:</span>
              <span
                :style="{ backgroundColor: selectedZone.color }"
                class="w-5 h-5 rounded"
              />
              <span class="text-[var(--text-primary)] font-mono text-xs">
                {{ selectedZone.color }}
              </span>
            </div>

            <div>
              <span class="text-[var(--text-muted)]">Статус:</span>
              <UiBadge
                :variant="selectedZone.isActive ? 'success' : 'neutral'"
                class="ml-2"
                size="sm"
              >
                {{ selectedZone.isActive ? 'Активна' : 'Неактивна' }}
              </UiBadge>
            </div>

            <div>
              <span class="text-[var(--text-muted)]">Создана:</span>
              <span class="ml-2 text-[var(--text-secondary)]">
                {{ new Date(selectedZone.createdAt).toLocaleDateString('ru-RU') }}
              </span>
            </div>
          </div>
        </UiCard>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <UiDeleteConfirmModal
      :show="showDeleteModal"
      :item-name="zoneToDelete?.name || ''"
      title="Удаление зоны покрытия"
      message="Зона будет деактивирована и скрыта. Для подтверждения введите название зоны:"
      @close="showDeleteModal = false; zoneToDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
