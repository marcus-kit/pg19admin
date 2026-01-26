<script setup lang="ts">
import type OLMap from 'ol/Map'
import type VectorLayer from 'ol/layer/Vector'
import type Overlay from 'ol/Overlay'
import type Feature from 'ol/Feature'
import type { Geometry } from 'ol/geom'
import type RenderFeature from 'ol/render/Feature'
import type { StyleLike } from 'ol/style/Style'
import type VectorSource from 'ol/source/Vector'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Карта покрытия — Админ-панель' })

const toast = useToast()

// Интерфейс зоны покрытия
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

// Интерфейс партнёра
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

// CoverageMap state
let map: OLMap | null = null
let vectorLayer: VectorLayer<VectorSource<Feature<Geometry>>> | null = null
let popupOverlay: Overlay | null = null
let hoveredFeatureId: number | null = null

const mapContainer = ref<HTMLDivElement | null>(null)
const popupContainer = ref<HTMLDivElement | null>(null)
const popupContent = ref('')

// CoverageImportExport state
const fileInput = ref<HTMLInputElement | null>(null)
const replaceExisting = ref(false)
const importing = ref(false)
const importError = ref('')
const importOwner = ref<string>('pg19')
const exportPartnerId = ref<string>('all')

const importOwnerOptions = computed(() => [
  { value: 'pg19', label: 'ПЖ19' },
  ...partners.value.map(p => ({ value: p.id, label: p.name })),
])

const exportPartnerOptions = computed(() => [
  { value: 'all', label: 'Все зоны' },
  ...partners.value.map(p => ({ value: p.id, label: p.name })),
])

// Загрузка списка партнёров
async function fetchPartners() {
  loadingPartners.value = true
  try {
    const data = await $fetch<{ partners: Partner[] }>('/api/admin/partners')
    partners.value = data.partners
  }
  catch {
    toast.error('Не удалось загрузить список партнёров')
  }
  finally {
    loadingPartners.value = false
  }
}

// Выбор партнёра для фильтрации (toggle)
function selectPartner(partnerId: string) {
  if (selectedPartnerId.value === partnerId) {
    selectedPartnerId.value = null
  }
  else {
    selectedPartnerId.value = partnerId
  }
}

const filteredZones = computed(() => {
  return zones.value.filter((zone) => {
    if (selectedPartnerId.value) {
      if (zone.partnerId !== selectedPartnerId.value) return false
    }
    if (showOnlyActive.value && !zone.isActive) {
      return false
    }
    return true
  })
})

const visibleZonesForMap = computed(() => {
  return filteredZones.value.filter(zone => !hiddenZoneIds.value.has(zone.id))
})

// Загрузка списка зон покрытия
async function fetchZones() {
  loading.value = true
  try {
    const data = await $fetch<{ zones: CoverageZone[] }>('/api/admin/coverage/zones')
    zones.value = data.zones
  }
  catch {
    toast.error('Не удалось загрузить зоны покрытия')
  }
  finally {
    loading.value = false
  }
}

// Обработка клика по зоне в списке
function handleZoneClick(zone: CoverageZone) {
  selectedZone.value = zone
}

// ==================== ХЕЛПЕРЫ КАРТЫ ====================

// Экранирование HTML для безопасного отображения в popup
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Конвертация HEX цвета в RGBA с прозрачностью
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Инициализация карты OpenLayers
async function initMap() {
  if (!mapContainer.value || map) return

  const [
    { default: Map },
    { default: View },
    { default: TileLayer },
    { default: VectorLayer },
    { default: VectorSource },
    { default: OSM },
    { Style, Fill, Stroke },
    { default: Overlay },
    { fromLonLat },
  ] = await Promise.all([
    import('ol/Map'),
    import('ol/View'),
    import('ol/layer/Tile'),
    import('ol/layer/Vector'),
    import('ol/source/Vector'),
    import('ol/source/OSM'),
    import('ol/style'),
    import('ol/Overlay'),
    import('ol/proj'),
  ])

  await import('ol/ol.css')

  const vectorSource = new VectorSource()

  const styleFunction = (feature: Feature<Geometry> | RenderFeature, isHovered = false) => {
    const zone = feature.get('zone') as CoverageZone
    const strokeWidth = isHovered ? zone.strokeWidth + 2 : zone.strokeWidth
    const fillOpacity = isHovered ? Math.min(zone.fillOpacity + 0.2, 0.8) : zone.fillOpacity

    return new Style({
      fill: new Fill({
        color: hexToRgba(zone.color, fillOpacity),
      }),
      stroke: new Stroke({
        color: zone.color,
        width: strokeWidth,
      }),
    })
  }

  vectorLayer = new VectorLayer({
    source: vectorSource,
    style: ((feature: Feature<Geometry> | RenderFeature) => styleFunction(feature, feature.getId() === hoveredFeatureId)) as StyleLike,
  })

  popupOverlay = new Overlay({
    element: popupContainer.value!,
    autoPan: true,
    autoPanAnimation: { duration: 250 },
  })

  map = new Map({
    target: mapContainer.value,
    layers: [
      new TileLayer({ source: new OSM() }),
      vectorLayer,
    ],
    overlays: [popupOverlay],
    view: new View({
      center: fromLonLat([37.6173, 55.7558]),
      zoom: 10,
    }),
  })

  map.on('click', (evt) => {
    const feature = map!.forEachFeatureAtPixel(evt.pixel, f => f)

    if (feature) {
      const zone = feature.get('zone') as CoverageZone
      const coordinate = evt.coordinate

      const typeLabel = zone.type === 'pg19' ? 'ПЖ19' : (zone.partner?.name || 'Партнёр')
      const typeBg = zone.type === 'pg19'
        ? 'background: rgba(247, 148, 29, 0.2); color: #F7941D;'
        : 'background: rgba(233, 30, 140, 0.2); color: #E91E8C;'
      const statusBg = zone.isActive
        ? 'background: rgba(34, 197, 94, 0.2); color: #22C55E;'
        : 'background: rgba(107, 114, 128, 0.2); color: #9CA3AF;'

      const safeName = escapeHtml(zone.name)
      const safeDescription = zone.description ? escapeHtml(zone.description) : ''
      const safeTypeLabel = escapeHtml(typeLabel)

      popupContent.value = `
        <h4 style="font-weight: 600; font-size: 14px; margin: 0 0 8px 0; color: #1f2937;">${safeName}</h4>
        ${safeDescription ? `<p style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0;">${safeDescription}</p>` : ''}
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <span style="padding: 2px 8px; border-radius: 9999px; font-size: 11px; ${typeBg}">${safeTypeLabel}</span>
          <span style="padding: 2px 8px; border-radius: 9999px; font-size: 11px; ${statusBg}">${zone.isActive ? 'Активна' : 'Неактивна'}</span>
        </div>
      `

      popupOverlay.setPosition(coordinate)
      handleZoneClick(zone)
    }
    else {
      popupOverlay.setPosition(undefined)
    }
  })

  map.on('pointermove', (evt) => {
    if (evt.dragging) return

    const feature = map!.forEachFeatureAtPixel(evt.pixel, f => f)
    const newHoveredId = feature ? feature.getId() : null

    if (newHoveredId !== hoveredFeatureId) {
      hoveredFeatureId = newHoveredId
      vectorLayer!.changed()
      map!.getTargetElement().style.cursor = feature ? 'pointer' : ''
    }
  })

  updateZones()
}

// Обновление зон на карте (перерисовка)
async function updateZones() {
  if (!map || !vectorLayer) return

  const { default: GeoJSONFormat } = await import('ol/format/GeoJSON')

  const vectorSource = vectorLayer.getSource()
  vectorSource!.clear()

  if (visibleZonesForMap.value.length === 0) return

  const featureCollection = {
    type: 'FeatureCollection',
    features: visibleZonesForMap.value.map(zone => ({
      type: 'Feature',
      id: zone.id,
      geometry: zone.geometry,
      properties: { zone },
    })),
  }

  const geoJsonFormat = new GeoJSONFormat({
    featureProjection: 'EPSG:3857',
  })

  const features = geoJsonFormat.readFeatures(featureCollection)

  features.forEach((feature, index) => {
    feature.setId(visibleZonesForMap.value[index].id)
    feature.set('zone', visibleZonesForMap.value[index])
  })

  vectorSource!.addFeatures(features)

  const extent = vectorSource!.getExtent()
  if (extent && extent[0] !== Infinity) {
    map!.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 500 })
  }
}

// Закрытие popup на карте
function closePopup() {
  if (popupOverlay) {
    popupOverlay.setPosition(undefined)
  }
}

// ==================== ИМПОРТ/ЭКСПОРТ ====================

// Открытие диалога выбора файла
function triggerFileInput() {
  fileInput.value?.click()
}

// Обработка выбора файла для импорта GeoJSON
async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  if (!file.name.endsWith('.geojson') && !file.name.endsWith('.json')) {
    importError.value = 'Поддерживаются только .geojson и .json файлы'
    return
  }

  importing.value = true
  importError.value = ''

  try {
    const text = await file.text()
    const geojson = JSON.parse(text)

    if (!geojson.type) {
      throw new Error('Невалидный GeoJSON: отсутствует type')
    }

    const isPg19 = importOwner.value === 'pg19'

    const result = await $fetch<{ success: boolean, imported: number }>('/api/admin/coverage/import', {
      method: 'POST',
      body: {
        geojson,
        type: isPg19 ? 'pg19' : 'partner',
        partnerId: isPg19 ? undefined : importOwner.value,
        replaceExisting: replaceExisting.value,
      },
    })

    if (result.success) {
      toast.success(`Импортировано ${result.imported} зон`)
      await fetchZones()
    }
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Не удалось импортировать зоны'
    importError.value = message
    toast.error(message)
  }
  finally {
    importing.value = false
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

// Экспорт зон в GeoJSON файл
function handleExport() {
  const params = new URLSearchParams()
  if (exportPartnerId.value !== 'all') {
    params.set('partnerId', exportPartnerId.value)
  }
  const url = params.toString() ? `/api/admin/coverage/export?${params.toString()}` : '/api/admin/coverage/export'
  window.open(url, '_blank')
}

// Очистка ошибки импорта
function clearImportError() {
  importError.value = ''
}

// ==================== УПРАВЛЕНИЕ ЗОНАМИ ====================

// Открытие модала подтверждения удаления
function openDeleteModal(zone: CoverageZone) {
  zoneToDelete.value = zone
  showDeleteModal.value = true
}

// Подтверждение удаления зоны
async function confirmDelete() {
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
    const message = error instanceof Error ? error.message : 'Не удалось удалить зону'
    toast.error(message)
  }
}

// Переключение видимости зоны на карте (сохраняется в localStorage)
function toggleZoneVisibility(zone: CoverageZone) {
  const newHidden = new Set(hiddenZoneIds.value)
  if (newHidden.has(zone.id)) {
    newHidden.delete(zone.id)
  }
  else {
    newHidden.add(zone.id)
  }
  hiddenZoneIds.value = newHidden
  localStorage.setItem('coverage-hidden-zones', JSON.stringify([...newHidden]))
}

// Проверка, скрыта ли зона
function isZoneHidden(zoneId: number) {
  return hiddenZoneIds.value.has(zoneId)
}

// Watch for zone changes
watch(visibleZonesForMap, updateZones, { deep: true })

onMounted(() => {
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
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.setTarget(undefined)
    map = null
  }
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

            <UiButton
              :class="{ 'bg-white/10': !selectedPartnerId }"
              variant="ghost"
              size="sm"
              @click="selectedPartnerId = null"
            >
              Все
            </UiButton>

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

        <!-- Map (бывший CoverageMap) -->
        <ClientOnly>
          <div class="relative">
            <div
              ref="mapContainer"
              style="height: 500px"
              class="rounded-xl overflow-hidden border border-[var(--glass-border)]"
            />

            <!-- Popup overlay -->
            <div ref="popupContainer" class="ol-popup">
              <button class="ol-popup-closer" @click="closePopup">&times;</button>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div class="ol-popup-content" v-html="popupContent" />
            </div>
          </div>
          <template #fallback>
            <div class="h-[500px] flex items-center justify-center glass-card rounded-xl">
              <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary" />
            </div>
          </template>
        </ClientOnly>

        <!-- Import/Export (бывший CoverageImportExport) -->
        <UiCard>
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-[var(--text-primary)]">
              Импорт / Экспорт
            </h3>

            <div
              v-if="importError"
              class="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center justify-between"
            >
              <span>{{ importError }}</span>
              <button class="ml-2 hover:text-red-300" @click="clearImportError">
                <Icon name="heroicons:x-mark" class="w-4 h-4" />
              </button>
            </div>

            <div class="space-y-3">
              <label class="block text-sm font-medium text-[var(--text-secondary)]">
                Импорт GeoJSON
              </label>

              <div class="space-y-3">
                <UiSelect
                  v-model="importOwner"
                  :options="importOwnerOptions"
                  :placeholder="undefined"
                  size="sm"
                />

                <label class="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                  <input
                    v-model="replaceExisting"
                    type="checkbox"
                    class="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary"
                  />
                  Заменить существующие
                </label>
              </div>

              <input
                ref="fileInput"
                type="file"
                accept=".geojson,.json"
                class="hidden"
                @change="handleFileSelect"
              />

              <UiButton
                :loading="importing"
                :disabled="loading || importing"
                variant="secondary"
                class="w-full"
                @click="triggerFileInput"
              >
                <Icon name="heroicons:arrow-up-tray" class="w-4 h-4" />
                Загрузить GeoJSON
              </UiButton>

              <p class="text-xs text-[var(--text-muted)]">
                Поддерживаются форматы: FeatureCollection, Feature, Polygon
              </p>
            </div>

            <hr class="border-[var(--glass-border)]" />

            <div class="space-y-3">
              <label class="block text-sm font-medium text-[var(--text-secondary)]">
                Экспорт зон
              </label>

              <UiSelect
                v-model="exportPartnerId"
                :options="exportPartnerOptions"
                :placeholder="undefined"
                size="sm"
              />

              <UiButton
                :disabled="loading"
                variant="ghost"
                class="w-full"
                @click="handleExport"
              >
                <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
                Скачать GeoJSON
              </UiButton>
            </div>
          </div>
        </UiCard>
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

<style>
@import 'ol/ol.css';

.ol-popup {
  position: absolute;
  background-color: white;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  padding: 12px 16px;
  border-radius: 12px;
  min-width: 180px;
  bottom: 12px;
  left: -90px;
}

.ol-popup:after,
.ol-popup:before {
  top: 100%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}

.ol-popup:after {
  border-top-color: white;
  border-width: 10px;
  left: 90px;
  margin-left: -10px;
}

.ol-popup:before {
  border-top-color: rgba(0, 0, 0, 0.1);
  border-width: 11px;
  left: 90px;
  margin-left: -11px;
}

.ol-popup-closer {
  position: absolute;
  top: 4px;
  right: 8px;
  font-size: 18px;
  font-weight: bold;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.ol-popup-closer:hover {
  color: #6b7280;
}

.ol-popup-content {
  padding-right: 16px;
}

.ol-control button {
  background-color: rgba(255, 255, 255, 0.9);
}

.ol-control button:hover,
.ol-control button:focus {
  background-color: rgba(255, 255, 255, 1);
}
</style>
