// GET /api/admin/partners
// Список активных партнёров для фильтров и выпадающих списков

import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const supabase = serverSupabaseServiceRole(event)

  const { data: partners, error } = await supabase
    .from('partners')
    .select('id, organization_name, color, status')
    .eq('status', 'active')
    .not('organization_name', 'ilike', '%ПЖ19%')
    .order('organization_name', { ascending: true })

  if (error) {
    console.error('Failed to fetch partners:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке партнёров'
    })
  }

  return {
    partners: (partners || []).map(p => ({
      id: p.id,
      name: p.organization_name,
      color: p.color || '#E91E8C'
    }))
  }
})
