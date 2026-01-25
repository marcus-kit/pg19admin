import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { mapNews, type DbNews } from '~~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const supabase = useSupabaseAdmin(event)

  let queryBuilder = supabase
    .from('news')
    .select('*')
    .order('date_created', { ascending: false })

  if (query.status && query.status !== 'all') {
    queryBuilder = queryBuilder.eq('status', query.status)
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Failed to fetch news:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке новостей',
    })
  }

  const news = (data as DbNews[] || []).map(mapNews)

  return { news }
})
