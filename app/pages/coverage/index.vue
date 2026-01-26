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

      <UiButton @click="showZonesDrawer = true" variant="secondary">
        <Icon name="heroicons:queue-list" class="w-4 h-4" />
        Список зон ({{ filteredZones.length }})
      </UiButton>
    </div>

    <div class="space-y-4">
      <!-- Map (full width) -->
      <div class="space-y-4">
        <!-- Filters -->
        <UiCard padding="sm">
          <div class="flex flex-wrap gap-3 items-center">
            <span class="text-sm text-[var(--text-secondary)]">Партнёр:</span>

            <UiButton
              :class="{ 'bg-white/10': !selectedPartnerId }"
              @click="selectedPartnerId = null"
              variant="ghost"
              size="sm"
            >
              Все
            </UiButton>

            <UiButton
              v-for="partner in partners"
              :key="partner.id"
              :class="{ 'ring-2 ring-offset-1 ring-offset-transparent': selectedPartnerId === partner.id }"
              :style="selectedPartnerId === partner.id ? { ringColor: partner.color } : {}"
              @click="selectPartner(partner.id)"
              variant="ghost"
              size="sm"
            >
              <span
                :style="{ backgroundColor: partner.color }"
                class="w-3 h-3 rounded-full mr-2"
              />
              {{ partner.name }}
            </UiButton>

            <UiToggle v-model="showOnlyActive" label="Только активные" size="sm" class="ml-auto" />
          </div>
        </UiCard>

        <!-- Map -->
        <ClientOnly>
          <div class="relative">
            <div
              ref="mapContainer"
              class="rounded-xl overflow-hidden border border-[var(--glass-border)]"
              style="height: calc(66vh - 2rem)"
            />

            <!-- Popup overlay -->
            <div ref="popupContainer" class="ol-popup">
              <button @click="closePopup" class="ol-popup-closer">
                &times;
              </button>
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

        <!-- Import/Export -->
        <UiCard class="space-y-4">
          <h3 class="text-lg font-semibold text-[var(--text-primary)]">Импорт / Экспорт</h3>

          <div v-if="importError" class="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center justify-between">
            <span>{{ importError }}</span>
            <button @click="importError = ''" class="ml-2 hover:text-red-300">
              <Icon name="heroicons:x-mark" class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-3">
            <label class="text-sm font-medium text-[var(--text-secondary)]">Импорт GeoJSON</label>
            <UiSelect v-model="importOwner" :options="importOwnerOptions" size="sm" />
            <UiToggle v-model="replaceExisting" label="Заменить существующие" size="sm" />
            <input ref="fileInput" @change="handleFileSelect" type="file" accept=".geojson,.json" class="hidden">
            <UiButton :loading="importing" :disabled="loading || importing" @click="fileInput?.click()" variant="secondary" class="w-full">
              <Icon name="heroicons:arrow-up-tray" class="w-4 h-4" />
              Загрузить GeoJSON
            </UiButton>
            <p class="text-xs text-[var(--text-muted)]">Форматы: FeatureCollection, Feature, Polygon</p>
          </div>

          <hr class="border-[var(--glass-border)]">

          <div class="space-y-3">
            <label class="text-sm font-medium text-[var(--text-secondary)]">Экспорт зон</label>
            <UiSelect v-model="exportPartnerId" :options="exportPartnerOptions" size="sm" />
            <UiButton :disabled="loading" @click="handleExport" variant="ghost" class="w-full">
              <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
              Скачать GeoJSON
            </UiButton>
          </div>
        </UiCard>
      </div>
    </div>

    <!-- Zones Drawer -->
    <ClientOnly>
      <Teleport to="body">
        <!-- Backdrop -->
        <Transition name="fade">
          <div
            v-if="showZonesDrawer"
            @click="showZonesDrawer = false"
            class="fixed inset-0 bg-black/50 z-40"
          />
        </Transition>

        <!-- Drawer Panel -->
        <Transition name="slide-right">
          <div
            v-if="showZonesDrawer"
            class="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--bg-secondary)] border-l border-[var(--glass-border)] z-50 overflow-y-auto"
          >
            <!-- Header -->
            <div class="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--glass-border)] p-4 flex items-center justify-between">
              <h2 class="text-lg font-semibold text-[var(--text-primary)]">
                Зоны покрытия ({{ filteredZones.length }})
              </h2>
              <button @click="showZonesDrawer = false" class="p-2 hover:bg-[var(--glass-bg)] rounded-lg text-[var(--text-muted)]">
                <Icon name="heroicons:x-mark" class="w-5 h-5" />
              </button>
            </div>

            <!-- Content -->
            <div class="p-4 space-y-4">
              <!-- Zone List -->
              <UiLoading v-if="loading" size="sm" />

              <div v-else class="space-y-2">
                <div
                  v-for="zone in filteredZones"
                  :key="zone.id"
                  :class="{ 'ring-2 ring-primary': selectedZone?.id === zone.id, 'opacity-50': hiddenZoneIds.has(zone.id) }"
                  @click="selectedZone = selectedZone?.id === zone.id ? null : zone"
                  class="p-3 rounded-lg border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors cursor-pointer"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span :style="{ backgroundColor: zone.color }" class="w-3 h-3 rounded-full flex-shrink-0" />
                        <span class="font-medium text-sm text-[var(--text-primary)] truncate">{{ zone.name }}</span>
                      </div>
                      <div class="flex gap-1 flex-wrap">
                        <UiBadge variant="info" size="sm">{{ zone.partner?.name || 'Партнёр' }}</UiBadge>
                        <UiBadge v-if="!zone.isActive" variant="neutral" size="sm">Неактивна</UiBadge>
                        <UiBadge v-if="hiddenZoneIds.has(zone.id)" variant="neutral" size="sm">Скрыта</UiBadge>
                      </div>
                    </div>
                    <div class="flex gap-1 flex-shrink-0">
                      <button :title="hiddenZoneIds.has(zone.id) ? 'Показать' : 'Скрыть'" @click.stop="toggleZoneVisibility(zone)" class="p-1 hover:bg-[var(--glass-bg)] rounded">
                        <Icon :name="hiddenZoneIds.has(zone.id) ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-4 h-4 text-[var(--text-muted)]" />
                      </button>
                      <button @click.stop="zoneToDelete = zone; showDeleteModal = true" title="Удалить" class="p-1 hover:bg-red-500/10 rounded">
                        <Icon name="heroicons:trash" class="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  <!-- Expanded Details -->
                  <Transition name="expand">
                    <div v-if="selectedZone?.id === zone.id" class="mt-3 pt-3 border-t border-[var(--glass-border)] text-sm space-y-2">
                      <div v-if="zone.partner">
                        <span class="text-[var(--text-muted)]">Партнёр:</span>
                        <span class="ml-2 text-[var(--text-primary)]">{{ zone.partner.name }}</span>
                      </div>
                      <div v-if="zone.description">
                        <span class="text-[var(--text-muted)]">Описание:</span>
                        <p class="mt-1 text-[var(--text-secondary)]">{{ zone.description }}</p>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-[var(--text-muted)]">Цвет:</span>
                        <span :style="{ backgroundColor: zone.color }" class="w-5 h-5 rounded" />
                        <span class="text-[var(--text-primary)] font-mono text-xs">{{ zone.color }}</span>
                      </div>
                      <div>
                        <span class="text-[var(--text-muted)]">Статус:</span>
                        <UiBadge :variant="zone.isActive ? 'success' : 'neutral'" size="sm" class="ml-2">
                          {{ zone.isActive ? 'Активна' : 'Неактивна' }}
                        </UiBadge>
                      </div>
                      <div>
                        <span class="text-[var(--text-muted)]">Создана:</span>
                        <span class="ml-2 text-[var(--text-secondary)]">{{ new Date(zone.createdAt).toLocaleDateString('ru-RU') }}</span>
                      </div>
                    </div>
                  </Transition>
                </div>

                <UiEmptyState v-if="filteredZones.length === 0" icon="heroicons:map" title="Нет зон покрытия" description="Импортируйте GeoJSON файл" />
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
