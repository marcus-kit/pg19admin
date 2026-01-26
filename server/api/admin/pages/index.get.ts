import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { type DbPage, mapPage } from '~~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  // Проверка авторизации и прав

  const query = getQuery(event)

  const supabase = useSupabaseAdmin(event)

  // Строим запрос
  let queryBuilder = supabase
    .from('pages')
    .select('*')
    .order('sort_order', { ascending: true })

  // Фильтр по статусу публикации
  if (query.published === 'true') {
    queryBuilder = queryBuilder.eq('is_published', true)
  }
  else if (query.published === 'false') {
    queryBuilder = queryBuilder.eq('is_published', false)
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Failed to fetch pages:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке страниц',
    })
  }

  // Маппинг snake_case → camelCase
  const pages = (data || []).map((item: DbPage) => mapPage(item))

  return { pages }
})
