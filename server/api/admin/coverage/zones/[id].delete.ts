import { serverSupabaseServiceRole } from '#supabase/server'
import { getAdminFromEvent } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const admin = await getAdminFromEvent(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID зоны обязателен' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Soft delete: active = false + аудит
  const { error } = await supabase
    .from('partner_coverage_zones')
    .update({
      active: false,
      deleted_by: admin.authUserId,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Failed to delete zone:', error)
    throw createError({ statusCode: 500, message: 'Ошибка при удалении зоны' })
  }

  return { success: true }
})
