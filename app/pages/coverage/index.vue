<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════════════
// 1. ИМПОРТЫ ТИПОВ
// ═══════════════════════════════════════════════════════════════════════════
import type OLMap from 'ol/Map'
import type VectorLayer from 'ol/layer/Vector'
import type Overlay from 'ol/Overlay'
import type Feature from 'ol/Feature'
import type { Geometry } from 'ol/geom'
import type VectorSource from 'ol/source/Vector'

interface CoverageZone {
  id: number
  name: string
  description: string | null
  partnerId: number | null
  partner: { id: number, name: string } | null
  geometry: object
  color: string
  isActive: boolean
  createdAt: string
}

interface Partner {
  id: number
  name: string
  color: string
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. МАКРОСЫ ВРЕМЕНИ КОМПИЛЯЦИИ
// ═══════════════════════════════════════════════════════════════════════════
definePageMeta({ middleware: 'admin' })
useHead({ title: 'Карта покрытия — Админ-панель' })

// ═══════════════════════════════════════════════════════════════════════════
// 3. COMPOSABLES
// ═══════════════════════════════════════════════════════════════════════════
const toast = useToast()

// ═══════════════════════════════════════════════════════════════════════════
// 4. РЕАКТИВНОЕ СОСТОЯНИЕ
// ═══════════════════════════════════════════════════════════════════════════

// Зоны покрытия
const loading = ref(true)
const zones = ref<CoverageZone[]>([])
const selectedZone = ref<CoverageZone | null>(null)
const selectedPartnerId = ref<number | null>(null)
const showOnlyActive = ref(true)
const hiddenZoneIds = ref<Set<number>>(new Set())

// Партнёры
const partners = ref<Partner[]>([])

// Модалка удаления
const showDeleteModal = ref(false)
const zoneToDelete = ref<CoverageZone | null>(null)

// Drawer со списком зон
const showZonesDrawer = ref(false)

// Карта OpenLayers (не реактивные — работаем напрямую с библиотекой)
let map: OLMap | null = null
let vectorLayer: VectorLayer<VectorSource<Feature<Geometry>>> | null = null
let popupOverlay: Overlay | null = null
let hoveredFeatureId: number | null = null
let isInitialLoad = true

const mapContainer = ref<HTMLDivElement | null>(null)
const popupContainer = ref<HTMLDivElement | null>(null)
const popupContent = ref('')

// Импорт/экспорт
const fileInput = ref<HTMLInputElement | null>(null)
const replaceExisting = ref(false)
const importing = ref(false)
const importError = ref('')
const importOwner = ref('')
const exportPartnerId = ref('all')

// ═══════════════════════════════════════════════════════════════════════════
// 5. COMPUTED
// ═══════════════════════════════════════════════════════════════════════════
const importOwnerOptions = computed(() =>
  partners.value.map(p => ({ value: String(p.id), label: p.name })),
)

const exportPartnerOptions = computed(() => [
  { value: 'all', label: 'Все зоны' },
  ...partners.value.map(p => ({ value: p.id, label: p.name })),
])

const filteredZones = computed(() =>
  zones.value.filter((zone) => {
    if (selectedPartnerId.value && zone.partnerId !== selectedPartnerId.value) return false
    if (showOnlyActive.value && !zone.isActive) return false
    return true
  }),
)

const visibleZonesForMap = computed(() =>
  filteredZones.value.filter(zone => !hiddenZoneIds.value.has(zone.id)),
)

// ═══════════════════════════════════════════════════════════════════════════
// 6. МЕТОДЫ
// ═══════════════════════════════════════════════════════════════════════════

// --- Загрузка данных ---

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

async function fetchPartners() {
  try {
    const data = await $fetch<{ partners: Partner[] }>('/api/admin/partners')
    partners.value = data.partners
  }
  catch {
    toast.error('Не удалось загрузить список партнёров')
  }
}

// --- Фильтрация и выбор ---

function selectPartner(partnerId: number) {
  selectedPartnerId.value = selectedPartnerId.value === partnerId ? null : partnerId
}

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

// --- Удаление зон ---

async function confirmDelete() {
  if (!zoneToDelete.value) return

  const id = zoneToDelete.value.id
  try {
    await $fetch(`/api/admin/coverage/zones/${id}`, { method: 'DELETE' })
    zones.value = zones.value.filter(z => z.id !== id)
    if (selectedZone.value?.id === id) selectedZone.value = null
    showDeleteModal.value = false
    zoneToDelete.value = null
    toast.success('Зона покрытия удалена')
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Не удалось удалить зону'
    toast.error(message)
  }
}

// --- Импорт/экспорт ---

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

    if (!geojson.type) throw new Error('Невалидный GeoJSON: отсутствует type')
    if (!importOwner.value) throw new Error('Выберите партнёра для импорта')

    const result = await $fetch<{ success: boolean, imported: number }>('/api/admin/coverage/import', {
      method: 'POST',
      body: { geojson, partnerId: Number(importOwner.value), replaceExisting: replaceExisting.value },
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
    if (fileInput.value) fileInput.value.value = ''
  }
}

function handleExport() {
  const query = exportPartnerId.value !== 'all' ? `?partnerId=${exportPartnerId.value}` : ''
  window.open(`/api/admin/coverage/export${query}`, '_blank')
}

// --- Карта OpenLayers ---

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

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

  const vectorSource = new VectorSource()

  function createZoneStyle(zone: CoverageZone, isHovered: boolean) {
    return new Style({
      fill: new Fill({ color: hexToRgba(zone.color, isHovered ? 0.5 : 0.3) }),
      stroke: new Stroke({ color: zone.color, width: isHovered ? 4 : 2 }),
    })
  }

  vectorLayer = new VectorLayer({
    source: vectorSource,
    style: (feature) => {
      const zone = feature.get('zone') as CoverageZone
      return createZoneStyle(zone, feature.getId() === hoveredFeatureId)
    },
  })

  popupOverlay = new Overlay({
    element: popupContainer.value!,
    autoPan: {
      animation: { duration: 250 },
    },
  })

  map = new Map({
    target: mapContainer.value,
    layers: [new TileLayer({ source: new OSM() }), vectorLayer],
    overlays: [popupOverlay],
    view: new View({ center: fromLonLat([38.897, 47.236]), zoom: 12 }),
  })

  map.on('click', (evt) => {
    const feature = map!.forEachFeatureAtPixel(evt.pixel, f => f)

    if (feature) {
      const zone = feature.get('zone') as CoverageZone
      const typeLabel = zone.partner?.name || 'Партнёр'
      const statusClass = zone.isActive ? 'ol-popup-badge--success' : 'ol-popup-badge--neutral'

      popupContent.value = `
        <h4 class="ol-popup-title">${escapeHtml(zone.name)}</h4>
        ${zone.description ? `<p class="ol-popup-desc">${escapeHtml(zone.description)}</p>` : ''}
        <div class="ol-popup-badges">
          <span class="ol-popup-badge ol-popup-badge--primary">${escapeHtml(typeLabel)}</span>
          <span class="ol-popup-badge ${statusClass}">${zone.isActive ? 'Активна' : 'Неактивна'}</span>
        </div>
      `
      popupOverlay!.setPosition(evt.coordinate)
      selectedZone.value = zone
    }
    else {
      popupOverlay!.setPosition(undefined)
    }
  })

  map.on('pointermove', (evt) => {
    if (evt.dragging) return

    const feature = map!.forEachFeatureAtPixel(evt.pixel, f => f)
    const newHoveredId = feature ? (feature.getId() as number | null) : null

    if (newHoveredId !== hoveredFeatureId) {
      hoveredFeatureId = newHoveredId
      vectorLayer!.changed()
      map!.getTargetElement().style.cursor = feature ? 'pointer' : ''
    }
  })

  updateZones()
}

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

  const geoJsonFormat = new GeoJSONFormat({ featureProjection: 'EPSG:3857' })
  const features = geoJsonFormat.readFeatures(featureCollection)
  vectorSource!.addFeatures(features)

  // Fit to extent только при изменении фильтров, не при первой загрузке
  if (!isInitialLoad) {
    const extent = vectorSource!.getExtent()
    if (extent && extent[0] !== Infinity) {
      map!.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 500 })
    }
  }
  isInitialLoad = false
}

function closePopup() {
  popupOverlay?.setPosition(undefined)
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. WATCH
// ═══════════════════════════════════════════════════════════════════════════
watch(visibleZonesForMap, updateZones, { deep: true })

watch(mapContainer, (el) => {
  if (el && !map) initMap()
})

// ═══════════════════════════════════════════════════════════════════════════
// 8. LIFECYCLE HOOKS
// ═══════════════════════════════════════════════════════════════════════════
onMounted(() => {
  // Восстановление скрытых зон из localStorage
  const saved = localStorage.getItem('coverage-hidden-zones')
  if (saved) {
    try {
      hiddenZoneIds.value = new Set(JSON.parse(saved) as number[])
    }
    catch { /* игнорируем невалидные данные */ }
  }

  fetchZones()
  fetchPartners()
})

onUnmounted(() => {
  if (map) {
    map.setTarget(undefined)
    map = null
  }
})
</script>

<template>
  <div class="coverage-page">
    <!-- Hero -->
    <header class="coverage-page__hero">
      <div class="coverage-page__hero-bg" aria-hidden="true" />
      <div class="coverage-page__hero-inner">
        <div class="flex items-center gap-3 mb-2">
          <div class="coverage-page__hero-icon">
            <Icon name="heroicons:map-pin" class="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 class="coverage-page__hero-title">Карта покрытия</h1>
            <p class="coverage-page__hero-subtitle">Управление зонами обслуживания ПЖ19 и партнёров</p>
          </div>
        </div>
        <div class="coverage-page__stats">
          <span class="coverage-page__stat"><strong>{{ zones.length }}</strong> зон</span>
          <span class="coverage-page__stat"><strong>{{ partners.length }}</strong> партнёров</span>
        </div>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="coverage-page__toolbar">
      <div class="coverage-page__bar-row">
        <div class="coverage-page__filters">
          <span class="coverage-page__filter-label">Партнёр:</span>
          <button
            type="button"
            class="coverage-page__filter-btn"
            :class="{ 'coverage-page__filter-btn--active': !selectedPartnerId }"
            @click="selectedPartnerId = null"
          >
            Все
          </button>
          <button
            v-for="partner in partners"
            :key="partner.id"
            type="button"
            class="coverage-page__filter-btn"
            :class="{ 'coverage-page__filter-btn--active': selectedPartnerId === partner.id }"
            :style="selectedPartnerId === partner.id ? { '--partner-color': partner.color } : {}"
            @click="selectPartner(partner.id)"
          >
            <span
              :style="{ backgroundColor: partner.color }"
              class="coverage-page__filter-dot"
            />
            {{ partner.name }}
          </button>
        </div>
        <div class="coverage-page__actions">
          <label class="coverage-page__toggle-wrap">
            <input v-model="showOnlyActive" type="checkbox" class="coverage-page__toggle-input">
            <span class="coverage-page__toggle-label">Только активные</span>
          </label>
          <button
            type="button"
            class="coverage-page__btn coverage-page__btn--secondary"
            @click="showZonesDrawer = true"
          >
            <Icon name="heroicons:queue-list" class="w-4 h-4" />
            <span>Список зон ({{ filteredZones.length }})</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Map block -->
    <div class="coverage-page__map-wrap glass-card glass-card-static">
      <ClientOnly>
        <div class="coverage-page__map-inner">
          <div
            ref="mapContainer"
            class="coverage-page__map"
          />

          <!-- Popup overlay -->
          <div ref="popupContainer" class="ol-popup">
            <button @click="closePopup" class="ol-popup-closer" type="button">
              &times;
            </button>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="ol-popup-content" v-html="popupContent" />
          </div>
        </div>
        <template #fallback>
          <div class="coverage-page__map-fallback">
            <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary" />
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Import/Export block -->
    <div class="coverage-page__block glass-card glass-card-static">
      <h2 class="coverage-page__block-title">Импорт / Экспорт</h2>

      <div v-if="importError" class="coverage-page__error" role="alert">
        <span>{{ importError }}</span>
        <button type="button" class="coverage-page__error-close" aria-label="Закрыть" @click="importError = ''">
          <Icon name="heroicons:x-mark" class="w-4 h-4" />
        </button>
      </div>

      <div class="coverage-page__import-section">
        <label class="coverage-page__label">Импорт GeoJSON</label>
        <UiSelect v-model="importOwner" :options="importOwnerOptions" size="sm" />
        <label class="coverage-page__toggle-wrap">
          <input v-model="replaceExisting" type="checkbox" class="coverage-page__toggle-input">
          <span class="coverage-page__toggle-label">Заменить существующие</span>
        </label>
        <input ref="fileInput" type="file" accept=".geojson,.json" class="hidden" @change="handleFileSelect">
        <UiButton :loading="importing" :disabled="loading || importing" @click="fileInput?.click()" variant="secondary" class="coverage-page__upload-btn">
          <Icon name="heroicons:arrow-up-tray" class="w-4 h-4" />
          Загрузить GeoJSON
        </UiButton>
        <p class="coverage-page__hint">Форматы: FeatureCollection, Feature, Polygon</p>
      </div>

      <hr class="coverage-page__divider">

      <div class="coverage-page__export-section">
        <label class="coverage-page__label">Экспорт зон</label>
        <UiSelect v-model="exportPartnerId" :options="exportPartnerOptions" size="sm" />
        <UiButton :disabled="loading" variant="secondary" class="coverage-page__download-btn" @click="handleExport">
          <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
          Скачать GeoJSON
        </UiButton>
      </div>
    </div>

    <!-- Zones Drawer -->
    <ClientOnly>
      <Teleport to="body">
        <Transition name="fade">
          <div
            v-if="showZonesDrawer"
            class="coverage-page__drawer-backdrop"
            aria-hidden="true"
            @click="showZonesDrawer = false"
          />
        </Transition>

        <Transition name="slide-right">
          <div
            v-if="showZonesDrawer"
            class="coverage-page__drawer"
            role="dialog"
            aria-label="Список зон покрытия"
          >
            <div class="coverage-page__drawer-header">
              <h2 class="coverage-page__drawer-title">Зоны покрытия ({{ filteredZones.length }})</h2>
              <button type="button" class="coverage-page__drawer-close" aria-label="Закрыть" @click="showZonesDrawer = false">
                <Icon name="heroicons:x-mark" class="w-5 h-5" />
              </button>
            </div>

            <div class="coverage-page__drawer-body">
              <UiLoading v-if="loading" size="sm" />

              <div v-else class="coverage-page__drawer-list">
                <div
                  v-for="zone in filteredZones"
                  :key="zone.id"
                  class="coverage-page__zone-card"
                  :class="{
                    'coverage-page__zone-card--selected': selectedZone?.id === zone.id,
                    'coverage-page__zone-card--hidden': hiddenZoneIds.has(zone.id),
                  }"
                  @click="selectedZone = selectedZone?.id === zone.id ? null : zone"
                >
                  <div class="coverage-page__zone-card-top">
                    <div class="coverage-page__zone-card-main">
                      <div class="coverage-page__zone-card-head">
                        <span :style="{ backgroundColor: zone.color }" class="coverage-page__zone-dot" />
                        <span class="coverage-page__zone-name">{{ zone.name }}</span>
                      </div>
                      <div class="coverage-page__zone-badges">
                        <UiBadge variant="info" size="sm">{{ zone.partner?.name || 'Партнёр' }}</UiBadge>
                        <UiBadge v-if="!zone.isActive" variant="neutral" size="sm">Неактивна</UiBadge>
                        <UiBadge v-if="hiddenZoneIds.has(zone.id)" variant="neutral" size="sm">Скрыта</UiBadge>
                      </div>
                    </div>
                    <div class="coverage-page__zone-actions">
                      <button type="button" :title="hiddenZoneIds.has(zone.id) ? 'Показать' : 'Скрыть'" class="coverage-page__zone-action" @click.stop="toggleZoneVisibility(zone)">
                        <Icon :name="hiddenZoneIds.has(zone.id) ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-4 h-4" />
                      </button>
                      <button type="button" title="Удалить" class="coverage-page__zone-action coverage-page__zone-action--danger" @click.stop="zoneToDelete = zone; showDeleteModal = true">
                        <Icon name="heroicons:trash" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <Transition name="expand">
                    <div v-if="selectedZone?.id === zone.id" class="coverage-page__zone-details">
                      <div v-if="zone.partner" class="coverage-page__zone-detail">
                        <span class="coverage-page__zone-detail-label">Партнёр:</span>
                        <span class="coverage-page__zone-detail-value">{{ zone.partner.name }}</span>
                      </div>
                      <div v-if="zone.description" class="coverage-page__zone-detail">
                        <span class="coverage-page__zone-detail-label">Описание:</span>
                        <p class="coverage-page__zone-detail-value coverage-page__zone-detail-desc">{{ zone.description }}</p>
                      </div>
                      <div class="coverage-page__zone-detail coverage-page__zone-detail--row">
                        <span class="coverage-page__zone-detail-label">Цвет:</span>
                        <span :style="{ backgroundColor: zone.color }" class="coverage-page__zone-color-swatch" />
                        <span class="coverage-page__zone-detail-value font-mono text-xs">{{ zone.color }}</span>
                      </div>
                      <div class="coverage-page__zone-detail">
                        <span class="coverage-page__zone-detail-label">Статус:</span>
                        <UiBadge :variant="zone.isActive ? 'success' : 'neutral'" size="sm">{{ zone.isActive ? 'Активна' : 'Неактивна' }}</UiBadge>
                      </div>
                      <div class="coverage-page__zone-detail">
                        <span class="coverage-page__zone-detail-label">Создана:</span>
                        <span class="coverage-page__zone-detail-value">{{ new Date(zone.createdAt).toLocaleDateString('ru-RU') }}</span>
                      </div>
                    </div>
                  </Transition>
                </div>

                <div v-if="filteredZones.length === 0" class="coverage-page__drawer-empty">
                  <Icon name="heroicons:map" class="coverage-page__drawer-empty-icon" />
                  <p class="coverage-page__drawer-empty-title">Нет зон покрытия</p>
                  <p class="coverage-page__drawer-empty-text">Импортируйте GeoJSON файл</p>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>

    <!-- Delete Confirmation Modal -->
    <UiDeleteConfirmModal
      :show="showDeleteModal"
      :item-name="zoneToDelete?.name || ''"
      @close="showDeleteModal = false; zoneToDelete = null"
      @confirm="confirmDelete"
      title="Удаление зоны покрытия"
      message="Зона будет деактивирована и скрыта. Для подтверждения введите название зоны:"
    />
  </div>
</template>

<style>
@import 'ol/ol.css';

/* Popup контейнер (белый фон для читаемости на карте) */
.ol-popup {
  position: absolute;
  background-color: #fff;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  padding: 12px 16px;
  border-radius: 12px;
  min-width: 180px;
  bottom: 12px;
  left: -90px;
}

.ol-popup::after,
.ol-popup::before {
  top: 100%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}

.ol-popup::after {
  border-top-color: #fff;
  border-width: 10px;
  left: 90px;
  margin-left: -10px;
}

.ol-popup::before {
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
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.ol-popup-closer:hover {
  color: var(--text-secondary);
}

.ol-popup-content {
  padding-right: 16px;
}

/* Popup контент */
.ol-popup-title {
  font-weight: 600;
  font-size: 14px;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.ol-popup-desc {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.ol-popup-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.ol-popup-badge {
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
}

.ol-popup-badge--primary {
  background: rgba(233, 30, 140, 0.2);
  color: #e91e8c;
}

.ol-popup-badge--success {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.ol-popup-badge--neutral {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
}

/* OpenLayers контролы */
.ol-control button {
  background-color: rgba(255, 255, 255, 0.9);
}

.ol-control button:hover,
.ol-control button:focus {
  background-color: rgba(255, 255, 255, 1);
}

/* Drawer animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  margin-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 200px;
}
</style>
