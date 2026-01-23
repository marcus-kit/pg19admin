import { serverSupabaseServiceRole } from '#supabase/server'

interface CreateZoneData {
  name: string
  description?: string
  type: 'pg19' | 'partner'
  partnerId?: number
  geometry: object
  color?: string
  fillOpacity?: number
  strokeWidth?: number
  isActive?: boolean
  sortOrder?: number
}

export default defineEventHandler(async (event) => {

  const body = await readBody<CreateZoneData>(event)
  const supabase = serverSupabaseServiceRole(event)

  // Validation
  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, message: 'Название зоны обязательно' })
  }

  if (!body.geometry || typeof body.geometry !== 'object') {
    throw createError({ statusCode: 400, message: 'Geometry обязателен (GeoJSON)' })
  }

  if (body.type === 'partner' && !body.partnerId) {
    throw createError({ statusCode: 400, message: 'Для партнёрской зоны нужен partner_id' })
  }

  const { data, error } = await supabase
    .from('coverage_zones')
    .insert({
      name: body.name.trim(),
      description: body.description || null,
      type: body.type || 'pg19',
      partner_id: body.type === 'partner' ? body.partnerId : null,
      geometry: body.geometry,
      color: body.color || (body.type === 'pg19' ? '#F7941D' : '#E91E8C'),
      fill_opacity: body.fillOpacity ?? 0.3,
      stroke_width: body.strokeWidth ?? 2,
      is_active: body.isActive ?? true,
      sort_order: body.sortOrder ?? 0
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create zone:', error)
    throw createError({ statusCode: 500, message: 'Ошибка при создании зоны' })
  }

  return { success: true, zone: { id: data.id, name: data.name } }
})
