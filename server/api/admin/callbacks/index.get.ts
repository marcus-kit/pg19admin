import { requirePermission } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

interface DbCallback {
  id: string
  name: string
  phone: string
  status: string
  source: string | null
  processed_by_admin?: { id: string; full_name: string } | null
  created_at: string
}

function mapCallback(cb: DbCallback) {
  return {
    id: cb.id,
    name: cb.name,
    phone: cb.phone,
    status: cb.status,
    source: cb.source,
    processedByAdmin: cb.processed_by_admin
      ? { id: cb.processed_by_admin.id, fullName: cb.processed_by_admin.full_name }
      : null,
    createdAt: cb.created_at
  }
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'requests:read')

  const query = getQuery(event)
  const status = query.status as string | undefined
  const limit = parseInt(query.limit as string) || 100

  const supabase = useSupabaseAdmin(event)

  let queryBuilder = supabase
    .from('callback_requests')
    .select(`
      id, name, phone, status, source, created_at,
      processed_by_admin:admins!processed_by(id, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status && ['new', 'processing', 'completed', 'rejected'].includes(status)) {
    queryBuilder = queryBuilder.eq('status', status)
  }

  const { data: callbacks, error } = await queryBuilder

  if (error) {
    console.error('Failed to fetch callbacks:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке заявок на звонок'
    })
  }

  return {
    callbacks: (callbacks as DbCallback[] || []).map(mapCallback)
  }
})
