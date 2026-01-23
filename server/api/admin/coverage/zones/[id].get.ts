import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID зоны обязателен' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('coverage_zones')
    .select(`*, partner:partners(id, name, slug)`)
    .eq('id', id)
    .single()

  if (error || !data) {
    throw createError({ statusCode: 404, message: 'Зона покрытия не найдена' })
  }

  return {
    zone: {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      partnerId: data.partner_id,
      partner: data.partner,
      geometry: data.geometry,
      color: data.color,
      fillOpacity: data.fill_opacity,
      strokeWidth: data.stroke_width,
      isActive: data.is_active,
      sortOrder: data.sort_order,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }
})
