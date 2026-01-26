import { serverSupabaseServiceRole } from '#supabase/server'

interface GeoJSONFeature {
  type: 'Feature'
  id: string
  geometry: unknown
  properties: Record<string, unknown>
}

interface PartnerCoverageZoneRow {
  id: number
  name: string
  description: string | null
  geometry: unknown
  partner_id: number | null
  active: boolean
  partner: { id: number, organization_name: string, color: string | null } | null
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const supabase = serverSupabaseServiceRole(event)

  let dbQuery = supabase
    .from('partner_coverage_zones')
    .select(`*, partner:partners(id, organization_name, color)`)
    .order('created_at', { ascending: true })

  if (query.partnerId) {
    dbQuery = dbQuery.eq('partner_id', query.partnerId)
  }

  if (query.active === 'true') {
    dbQuery = dbQuery.eq('active', true)
  }

  const { data } = await dbQuery

  const features: GeoJSONFeature[] = (data || []).map((zone: PartnerCoverageZoneRow) => ({
    type: 'Feature',
    id: `pcz_${zone.id}`,
    geometry: zone.geometry,
    properties: {
      id: zone.id,
      name: zone.name,
      description: zone.description,
      partnerId: zone.partner_id,
      partnerName: zone.partner?.organization_name || null,
      color: zone.partner?.color || '#E91E8C',
      isActive: zone.active,
    },
  }))

  const featureCollection = {
    type: 'FeatureCollection',
    features,
  }

  const dateStr = new Date().toISOString().split('T')[0]
  setHeader(event, 'Content-Type', 'application/geo+json')
  setHeader(event, 'Content-Disposition', `attachment; filename="coverage-zones-${dateStr}.geojson"`)

  return featureCollection
})
