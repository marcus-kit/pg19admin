import { serverSupabaseServiceRole } from '#supabase/server'
import { getAdminFromEvent } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const admin = await getAdminFromEvent(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID зоны обязателен' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Сначала пробуем найти в coverage_zones (PG19)
  const { data: pg19Zone } = await supabase
    .from('coverage_zones')
    .select('id')
    .eq('id', id)
    .single()

  if (pg19Zone) {
    // Soft delete для PG19 зон: is_active = false
    const { error } = await supabase
      .from('coverage_zones')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Failed to soft delete PG19 zone:', error)
      throw createError({ statusCode: 500, message: 'Ошибка при удалении зоны' })
    }

    return { success: true, type: 'pg19' }
  }

  // Если не нашли в coverage_zones, ищем в partner_coverage_zones
  const { data: partnerZone } = await supabase
    .from('partner_coverage_zones')
    .select('id')
    .eq('id', id)
    .single()

  if (partnerZone) {
    // Soft delete для партнёрских зон: active = false + аудит
    const { error } = await supabase
      .from('partner_coverage_zones')
      .update({
        active: false,
        deleted_by: admin.authUserId,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Failed to soft delete partner zone:', error)
      throw createError({ statusCode: 500, message: 'Ошибка при удалении зоны' })
    }

    return { success: true, type: 'partner' }
  }

  // Зона не найдена ни в одной таблице
  throw createError({ statusCode: 404, message: 'Зона не найдена' })
})
