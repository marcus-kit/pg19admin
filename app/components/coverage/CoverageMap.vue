<script setup lang="ts">
import type OLMap from 'ol/Map'
import type VectorLayer from 'ol/layer/Vector'
import type Overlay from 'ol/Overlay'
import type Feature from 'ol/Feature'
import type { Geometry } from 'ol/geom'
import type RenderFeature from 'ol/render/Feature'
import type { StyleLike } from 'ol/style/Style'
import type VectorSource from 'ol/source/Vector'

interface CoverageZone {
  id: number
  name: string
  description: string | null
  type: 'pg19' | 'partner'
  partnerId: number | null
  partner: { id: number, name: string, slug: string } | null
  geometry: object
  color: string
  fillOpacity: number
  strokeWidth: number
  isActive: boolean
}

interface Props {
  zones: CoverageZone[]
  center?: [number, number]
  zoom?: number
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  center: () => [55.7558, 37.6173], // Moscow default [lat, lon]
  zoom: 10,
  height: '500px',
})

const emit = defineEmits<{
  'zone-click': [zone: CoverageZone]
}>()

// OpenLayers instances — типизация через import type
let map: OLMap | null = null
let vectorLayer: VectorLayer<VectorSource<Feature<Geometry>>> | null = null
let popupOverlay: Overlay | null = null
let hoveredFeatureId: number | null = null

const mapContainer = ref<HTMLDivElement | null>(null)
const popupContainer = ref<HTMLDivElement | null>(null)
const popupContent = ref('')

// Helper для экранирования HTML (защита от XSS)
const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Helper to convert hex color to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const initMap = async () => {
  if (!mapContainer.value || map) return

  // Dynamic imports for SSR compatibility
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

  // Import CSS
  await import('ol/ol.css')

  // Create vector source and layer
  const vectorSource = new VectorSource()

  // Style function for features — Feature или RenderFeature из OpenLayers
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

  // Create popup overlay
  popupOverlay = new Overlay({
    element: popupContainer.value!,
    autoPan: true,
    autoPanAnimation: { duration: 250 },
  })

  // Create map
  map = new Map({
    target: mapContainer.value,
    layers: [
      new TileLayer({ source: new OSM() }),
      vectorLayer,
    ],
    overlays: [popupOverlay],
    view: new View({
      center: fromLonLat([props.center[1], props.center[0]]), // OL uses [lon, lat]
      zoom: props.zoom,
    }),
  })

  // Click handler — MapBrowserEvent для типизации
  map.on('click', (evt) => {
    const feature = map!.forEachFeatureAtPixel(evt.pixel, f => f)

    if (feature) {
      const zone = feature.get('zone') as CoverageZone
      const coordinate = evt.coordinate

      // Build popup content
      const typeLabel = zone.type === 'pg19' ? 'ПЖ19' : (zone.partner?.name || 'Партнёр')
      const typeBg = zone.type === 'pg19'
        ? 'background: rgba(247, 148, 29, 0.2); color: #F7941D;'
        : 'background: rgba(233, 30, 140, 0.2); color: #E91E8C;'
      const statusBg = zone.isActive
        ? 'background: rgba(34, 197, 94, 0.2); color: #22C55E;'
        : 'background: rgba(107, 114, 128, 0.2); color: #9CA3AF;'

      // Экранируем пользовательские данные для защиты от XSS
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
      emit('zone-click', zone)
    }
    else {
      popupOverlay.setPosition(undefined)
    }
  })

  // Hover effects — MapBrowserEvent для типизации
  map.on('pointermove', (evt) => {
    if (evt.dragging) return

    const feature = map!.forEachFeatureAtPixel(evt.pixel, f => f)
    const newHoveredId = feature ? feature.getId() : null

    if (newHoveredId !== hoveredFeatureId) {
      hoveredFeatureId = newHoveredId
      vectorLayer.changed() // Trigger re-render with new styles

      // Change cursor
      map.getTargetElement().style.cursor = feature ? 'pointer' : ''
    }
  })

  updateZones()
}

const updateZones = async () => {
  if (!map || !vectorLayer) return

  const { default: GeoJSONFormat } = await import('ol/format/GeoJSON')

  const vectorSource = vectorLayer.getSource()
  vectorSource.clear()

  if (props.zones.length === 0) return

  // Build FeatureCollection
  const featureCollection = {
    type: 'FeatureCollection',
    features: props.zones.map(zone => ({
      type: 'Feature',
      id: zone.id,
      geometry: zone.geometry,
      properties: { zone },
    })),
  }

  // Parse GeoJSON and add features
  const geoJsonFormat = new GeoJSONFormat({
    featureProjection: 'EPSG:3857', // Web Mercator
  })

  const features = geoJsonFormat.readFeatures(featureCollection)

  // Set zone data on each feature
  features.forEach((feature, index) => {
    feature.setId(props.zones[index].id)
    feature.set('zone', props.zones[index])
  })

  vectorSource.addFeatures(features)

  // Fit view to features
  const extent = vectorSource.getExtent()
  if (extent && extent[0] !== Infinity) {
    map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 500 })
  }
}

const closePopup = () => {
  if (popupOverlay) {
    popupOverlay.setPosition(undefined)
  }
}

// Watch for zone changes
watch(() => props.zones, updateZones, { deep: true })

onMounted(initMap)

onUnmounted(() => {
  if (map) {
    map.setTarget(undefined)
    map = null
  }
})
</script>

<template>
  <div class="relative">
    <div
      ref="mapContainer"
      :style="{ height }"
      class="rounded-xl overflow-hidden border border-[var(--glass-border)]"
    />

    <!-- Popup overlay -->
    <div ref="popupContainer" class="ol-popup">
      <button class="ol-popup-closer" @click="closePopup">&times;</button>
      <!-- eslint-disable-next-line vue/no-v-html -- Данные экранируются через escapeHtml() -->
      <div class="ol-popup-content" v-html="popupContent" />
    </div>
  </div>
</template>

<style>
@import 'ol/ol.css';

/* OpenLayers popup styling */
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

/* Override OpenLayers default styles */
.ol-control button {
  background-color: rgba(255, 255, 255, 0.9);
}

.ol-control button:hover,
.ol-control button:focus {
  background-color: rgba(255, 255, 255, 1);
}
</style>
