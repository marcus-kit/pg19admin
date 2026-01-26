import { serverSupabaseServiceRole } from '#supabase/server'

interface PartnerCoverageZoneRow {
  id: number
  name: string
  description: string | null
  geometry: unknown
  partner_id: number | null
  active: boolean
  created_at: string
  updated_at: string
  partner: { id: number, organization_name: string, color: string | null } | null
}

interface ZoneResponse {
  id: number
  name: string
  description: string | null
  partnerId: number | null
  partner: { id: number, name: string } | null
  geometry: unknown
  color: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const supabase = serverSupabaseServiceRole(event)

  let dbQuery = supabase
    .from('partner_coverage_zones')
    .select(`*, partner:partners(id, organization_name, color)`)
    .order('created_at', { ascending: true })

  if (query.active === 'true') {
    dbQuery = dbQuery.eq('active', true)
  }
  else if (query.active === 'false') {
    dbQuery = dbQuery.eq('active', false)
  }

  if (query.partnerId) {
    dbQuery = dbQuery.eq('partner_id', query.partnerId)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Failed to fetch partner_coverage_zones:', error)
    throw createError({ statusCode: 500, message: 'Ошибка при загрузке зон покрытия' })
  }

  const zones: ZoneResponse[] = (data || []).map((item: PartnerCoverageZoneRow) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    partnerId: item.partner_id,
    partner: item.partner ? { id: item.partner.id, name: item.partner.organization_name } : null,
    geometry: item.geometry,
    color: item.partner?.color || '#E91E8C',
    isActive: item.active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))

  return { zones }
})
