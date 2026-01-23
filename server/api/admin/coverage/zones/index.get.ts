import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const supabase = serverSupabaseServiceRole(event)

  const zones: any[] = []

  // Fetch from coverage_zones (ПЖ19 zones)
  if (query.type !== 'partner') {
    let pg19Query = supabase
      .from('coverage_zones')
      .select(`*, partner:partners(id, organization_name)`)
      .order('sort_order', { ascending: true })

    if (query.type === 'pg19') {
      pg19Query = pg19Query.eq('type', 'pg19')
    }

    if (query.active === 'true') {
      pg19Query = pg19Query.eq('is_active', true)
    } else if (query.active === 'false') {
      pg19Query = pg19Query.eq('is_active', false)
    }

    if (query.partnerId) {
      pg19Query = pg19Query.eq('partner_id', query.partnerId)
    }

    const { data: pg19Data, error: pg19Error } = await pg19Query

    if (pg19Error) {
      console.error('Failed to fetch coverage_zones:', pg19Error)
    } else {
      zones.push(...(pg19Data || []).map((item: any) => ({
        id: item.id,
        source: 'coverage_zones',
        name: item.name,
        description: item.description,
        type: item.type,
        partnerId: item.partner_id,
        partner: item.partner ? { id: item.partner.id, name: item.partner.organization_name } : null,
        geometry: item.geometry,
        color: item.color,
        fillOpacity: item.fill_opacity,
        strokeWidth: item.stroke_width,
        isActive: item.is_active,
        sortOrder: item.sort_order,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      })))
    }
  }

  // Fetch from partner_coverage_zones (партнёрские зоны)
  if (query.type !== 'pg19') {
    let partnerQuery = supabase
      .from('partner_coverage_zones')
      .select(`*, partner:partners(id, organization_name, color)`)
      .order('created_at', { ascending: true })

    if (query.active === 'true') {
      partnerQuery = partnerQuery.eq('active', true)
    } else if (query.active === 'false') {
      partnerQuery = partnerQuery.eq('active', false)
    }

    if (query.partnerId) {
      partnerQuery = partnerQuery.eq('partner_id', query.partnerId)
    }

    const { data: partnerData, error: partnerError } = await partnerQuery

    if (partnerError) {
      console.error('Failed to fetch partner_coverage_zones:', partnerError)
    } else {
      zones.push(...(partnerData || []).map((item: any) => ({
        id: item.id,
        source: 'partner_coverage_zones',
        name: item.name,
        description: item.description,
        type: 'partner' as const,
        partnerId: item.partner_id,
        partner: item.partner ? { id: item.partner.id, name: item.partner.organization_name } : null,
        geometry: item.geometry,
        color: item.partner?.color || '#E91E8C',
        fillOpacity: 0.3,
        strokeWidth: 2,
        isActive: item.active,
        sortOrder: 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      })))
    }
  }

  return { zones }
})
