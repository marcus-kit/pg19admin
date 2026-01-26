import { serverSupabaseServiceRole } from '#supabase/server'

interface CreateZoneData {
  name: string
  description?: string
  partnerId: number
  geometry: object
  isActive?: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateZoneData>(event)
  const supabase = serverSupabaseServiceRole(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, message: 'Название зоны обязательно' })
  }

  if (!body.geometry || typeof body.geometry !== 'object') {
    throw createError({ statusCode: 400, message: 'Geometry обязателен (GeoJSON)' })
  }

  if (!body.partnerId) {
    throw createError({ statusCode: 400, message: 'Partner ID обязателен' })
  }

  const { data, error } = await supabase
    .from('partner_coverage_zones')
    .insert({
      name: body.name.trim(),
      description: body.description || null,
      partner_id: body.partnerId,
      geometry: body.geometry,
      active: body.isActive ?? true,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create zone:', error)
    throw createError({ statusCode: 500, message: 'Ошибка при создании зоны' })
  }

  return { success: true, zone: { id: data.id, name: data.name } }
})
