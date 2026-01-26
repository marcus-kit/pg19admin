import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { mapCallbackRequest, type DbCallbackRequest } from '~~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const supabase = useSupabaseAdmin(event)

  let queryBuilder = supabase
    .from('callback_requests')
    .select('*, admins:processed_by(id, full_name)')
    .order('created_at', { ascending: false })

  if (query.status && query.status !== 'all') {
    queryBuilder = queryBuilder.eq('status', query.status)
  }

  if (query.search) {
    const search = `%${query.search}%`
    queryBuilder = queryBuilder.or(`name.ilike.${search},phone.ilike.${search}`)
  }

  const limit = Number(query.limit) || 100
  queryBuilder = queryBuilder.limit(limit)

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Failed to fetch callback requests:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке заявок на обратный звонок',
    })
  }

  return {
    requests: (data as DbCallbackRequest[] || []).map(mapCallbackRequest),
  }
})
