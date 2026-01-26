import { serverSupabaseServiceRole } from '#supabase/server'

interface UpdateZoneData {
  name?: string
  description?: string
  partnerId?: number | null
  geometry?: object
  isActive?: boolean
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
  if (body.partnerId !== undefined) dbData.partner_id = body.partnerId
  if (body.geometry !== undefined) dbData.geometry = body.geometry
  if (body.isActive !== undefined) dbData.active = body.isActive

  if (Object.keys(dbData).length === 0) {
    throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
  }

  const { data, error } = await supabase
    .from('partner_coverage_zones')
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
