import { serverSupabaseServiceRole } from '#supabase/server'

interface GeoJSONGeometry {
  type: string
  coordinates: unknown
}

interface GeoJSONFeature {
  type: 'Feature'
  geometry: GeoJSONGeometry
  properties?: Record<string, unknown>
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

type GeoJSONInput = GeoJSONFeatureCollection | GeoJSONFeature | GeoJSONGeometry

interface ImportOptions {
  geojson: GeoJSONInput
  partnerId: number
  replaceExisting?: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ImportOptions>(event)

  if (!body.geojson) {
    throw createError({ statusCode: 400, message: 'GeoJSON данные обязательны' })
  }

  if (!body.partnerId) {
    throw createError({ statusCode: 400, message: 'Partner ID обязателен' })
  }

  const geojson = body.geojson
  let features: GeoJSONFeature[] = []

  if (geojson.type === 'FeatureCollection') {
    features = geojson.features || []
  }
  else if (geojson.type === 'Feature') {
    features = [geojson]
  }
  else if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
    features = [{ type: 'Feature', geometry: geojson, properties: {} }]
  }
  else {
    throw createError({ statusCode: 400, message: 'Неподдерживаемый формат GeoJSON' })
  }

  if (features.length === 0) {
    throw createError({ statusCode: 400, message: 'Нет features для импорта' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Удалить существующие зоны партнёра если нужно
  if (body.replaceExisting) {
    await supabase
      .from('partner_coverage_zones')
      .delete()
      .eq('partner_id', body.partnerId)
  }

  // Подготовить зоны для вставки
  const zones = features.map((feature, index) => {
    const props = feature.properties || {}

    return {
      name: (props.name as string) || `Зона ${index + 1}`,
      description: (props.description as string) || null,
      partner_id: body.partnerId,
      geometry: feature.geometry,
      active: (props.isActive as boolean) ?? true,
    }
  })

  const { data, error } = await supabase
    .from('partner_coverage_zones')
    .insert(zones)
    .select('id, name')

  if (error) {
    console.error('Failed to import zones:', error)
    throw createError({ statusCode: 500, message: 'Ошибка при импорте зон: ' + error.message })
  }

  return {
    success: true,
    imported: data.length,
    zones: data,
  }
})
