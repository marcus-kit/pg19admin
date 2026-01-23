import { serverSupabaseServiceRole } from '#supabase/server'

interface UpdateZoneData {
  name?: string
  description?: string
  type?: 'pg19' | 'partner'
  partnerId?: number | null
  geometry?: object
  color?: string
  fillOpacity?: number
  strokeWidth?: number
  isActive?: boolean
  sortOrder?: number
}

export default defineEventHandler(async (event) => {

  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateZoneData>(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID зоны обязателен' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const dbData: Record<string, unknown> = {}

  if (body.name !== undefined) dbData.name = body.name
  if (body.description !== undefined) dbData.description = body.description
  if (body.type !== undefined) dbData.type = body.type
  if (body.partnerId !== undefined) dbData.partner_id = body.partnerId
  if (body.geometry !== undefined) dbData.geometry = body.geometry
  if (body.color !== undefined) dbData.color = body.color
  if (body.fillOpacity !== undefined) dbData.fill_opacity = body.fillOpacity
  if (body.strokeWidth !== undefined) dbData.stroke_width = body.strokeWidth
  if (body.isActive !== undefined) dbData.is_active = body.isActive
  if (body.sortOrder !== undefined) dbData.sort_order = body.sortOrder

  if (Object.keys(dbData).length === 0) {
    throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
  }

  const { data, error } = await supabase
    .from('coverage_zones')
    .update(dbData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update zone:', error)
    throw createError({ statusCode: 500, message: 'Ошибка при обновлении зоны' })
  }

  return { success: true, zone: { id: data.id, name: data.name } }
})
