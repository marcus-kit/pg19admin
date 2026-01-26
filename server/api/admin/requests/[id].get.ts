import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { requireParam } from '~~/server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = requireParam(event, 'id', 'заявки')
  const supabase = useSupabaseAdmin(event)

  const { data, error } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 404,
      message: 'Заявка не найдена',
    })
  }

  // Маппим snake_case -> camelCase
  const request = {
    id: data.id,
    fullName: data.full_name || data.contact_name || '',
    phone: data.phone || data.contact_value || '',
    addressText: data.address_text || data.address_raw || '',
    addressComponents: data.address_components,
    latitude: data.latitude,
    longitude: data.longitude,
    inCoverageZone: data.in_coverage_zone || false,
    coverageZoneId: data.coverage_zone_id,
    status: data.status || 'new',
    source: data.source || 'website',
    metadata: data.metadata,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }

  return { request }
})
