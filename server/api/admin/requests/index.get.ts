import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { mapConnectionRequest, type DbConnectionRequest } from '~~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const supabase = useSupabaseAdmin(event)

  let queryBuilder = supabase
    .from('connection_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (query.status && query.status !== 'all') {
    queryBuilder = queryBuilder.eq('status', query.status)
  }

  if (query.inCoverage === 'true') {
    queryBuilder = queryBuilder.eq('in_coverage_zone', true)
  }

  if (query.search) {
    const search = `%${query.search}%`
    queryBuilder = queryBuilder.or(`full_name.ilike.${search},address_text.ilike.${search},phone.ilike.${search}`)
  }

  const limit = Number(query.limit) || 100
  queryBuilder = queryBuilder.limit(limit)

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Failed to fetch connection requests:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке заявок',
    })
  }

  return {
    requests: (data as DbConnectionRequest[] || []).map(mapConnectionRequest),
  }
})
