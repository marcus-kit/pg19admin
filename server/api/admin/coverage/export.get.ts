import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const supabase = serverSupabaseServiceRole(event)

  const features: any[] = []

  const filterPartnerId = query.partnerId as string | undefined

  // Fetch from coverage_zones (ПЖ19 zones)
  // Пропускаем если запрошены только зоны партнёров или указан конкретный partnerId
  if (query.type !== 'partner' && !filterPartnerId) {
    let pg19Query = supabase
      .from('coverage_zones')
      .select(`*, partner:partners(id, organization_name)`)
      .order('sort_order', { ascending: true })

    if (query.type === 'pg19') {
      pg19Query = pg19Query.eq('type', 'pg19')
    }

    if (query.active === 'true') {
      pg19Query = pg19Query.eq('is_active', true)
    }

    const { data: pg19Data } = await pg19Query

    features.push(...(pg19Data || []).map((zone: any) => ({
      type: 'Feature',
      id: `cz_${zone.id}`,
      geometry: zone.geometry,
      properties: {
        id: zone.id,
        source: 'coverage_zones',
        name: zone.name,
        description: zone.description,
        type: zone.type,
        partnerId: zone.partner_id,
        partnerName: zone.partner?.organization_name || null,
        color: zone.color,
        fillOpacity: zone.fill_opacity,
        strokeWidth: zone.stroke_width,
        isActive: zone.is_active
      }
    })))
  }

  // Fetch from partner_coverage_zones
  if (query.type !== 'pg19') {
    let partnerQuery = supabase
      .from('partner_coverage_zones')
      .select(`*, partner:partners(id, organization_name)`)
      .order('created_at', { ascending: true })

    // Фильтр по конкретному партнёру
    if (filterPartnerId) {
      partnerQuery = partnerQuery.eq('partner_id', filterPartnerId)
    }

    if (query.active === 'true') {
      partnerQuery = partnerQuery.eq('active', true)
    }

    const { data: partnerData } = await partnerQuery

    features.push(...(partnerData || []).map((zone: any) => ({
      type: 'Feature',
      id: `pcz_${zone.id}`,
      geometry: zone.geometry,
      properties: {
        id: zone.id,
        source: 'partner_coverage_zones',
        name: zone.name,
        description: zone.description,
        type: 'partner',
        partnerId: zone.partner_id,
        partnerName: zone.partner?.organization_name || null,
        color: '#E91E8C',
        fillOpacity: 0.3,
        strokeWidth: 2,
        isActive: zone.active
      }
    })))
  }

  // Build GeoJSON FeatureCollection
  const featureCollection = {
    type: 'FeatureCollection',
    features
  }

  // Set headers for file download
  const dateStr = new Date().toISOString().split('T')[0]
  setHeader(event, 'Content-Type', 'application/geo+json')
  setHeader(event, 'Content-Disposition', `attachment; filename="coverage-zones-${dateStr}.geojson"`)

  return featureCollection
})
