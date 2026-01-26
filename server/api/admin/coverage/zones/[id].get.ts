import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID зоны обязателен' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('partner_coverage_zones')
    .select(`*, partner:partners(id, organization_name, color)`)
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
      partnerId: data.partner_id,
      partner: data.partner
        ? {
            id: data.partner.id,
            name: data.partner.organization_name,
            color: data.partner.color,
          }
        : null,
      geometry: data.geometry,
      color: data.partner?.color || '#E91E8C',
      isActive: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  }
})
