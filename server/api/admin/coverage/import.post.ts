import { serverSupabaseServiceRole } from '#supabase/server'

interface ImportOptions {
  geojson: any
  type?: 'pg19' | 'partner'
  partnerId?: number
  defaultColor?: string
  replaceExisting?: boolean
}

export default defineEventHandler(async (event) => {

  const body = await readBody<ImportOptions>(event)

  if (!body.geojson) {
    throw createError({ statusCode: 400, message: 'GeoJSON данные обязательны' })
  }

  const geojson = body.geojson
  let features: any[] = []

  // Support both FeatureCollection and single Feature
  if (geojson.type === 'FeatureCollection') {
    features = geojson.features || []
  } else if (geojson.type === 'Feature') {
    features = [geojson]
  } else if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
    features = [{ type: 'Feature', geometry: geojson, properties: {} }]
  } else {
    throw createError({ statusCode: 400, message: 'Неподдерживаемый формат GeoJSON' })
  }

  if (features.length === 0) {
    throw createError({ statusCode: 400, message: 'Нет features для импорта' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Optional: delete existing zones before import
  if (body.replaceExisting) {
    let deleteQuery = supabase.from('coverage_zones').delete()

    if (body.type) {
      deleteQuery = deleteQuery.eq('type', body.type)
    }
    if (body.partnerId) {
      deleteQuery = deleteQuery.eq('partner_id', body.partnerId)
    }

    // Delete all matching (need at least one condition)
    if (!body.type && !body.partnerId) {
      // Delete all zones
      deleteQuery = deleteQuery.neq('id', 0)
    }

    await deleteQuery
  }

  // Determine default color based on type
  const defaultColor = body.defaultColor || (body.type === 'partner' ? '#E91E8C' : '#F7941D')

  // Prepare zones for insert
  const zones = features.map((feature, index) => {
    const props = feature.properties || {}
    const zoneType = body.type || props.type || 'pg19'

    return {
      name: props.name || `Зона ${index + 1}`,
      description: props.description || null,
      type: zoneType,
      partner_id: zoneType === 'partner' ? (body.partnerId || props.partnerId || null) : null,
      geometry: feature.geometry,
      color: props.color || defaultColor,
      fill_opacity: props.fillOpacity ?? 0.3,
      stroke_width: props.strokeWidth ?? 2,
      is_active: props.isActive ?? true,
      sort_order: props.sortOrder ?? index
    }
  })

  // Validate partner zones have partner_id
  const invalidPartnerZones = zones.filter(z => z.type === 'partner' && !z.partner_id)
  if (invalidPartnerZones.length > 0) {
    throw createError({
      statusCode: 400,
      message: `Для партнёрских зон требуется partner_id. Не указан для: ${invalidPartnerZones.map(z => z.name).join(', ')}`
    })
  }

  const { data, error } = await supabase
    .from('coverage_zones')
    .insert(zones)
    .select('id, name')

  if (error) {
    console.error('Failed to import zones:', error)
    throw createError({ statusCode: 500, message: 'Ошибка при импорте зон: ' + error.message })
  }

  return {
    success: true,
    imported: data.length,
    zones: data
  }
})
