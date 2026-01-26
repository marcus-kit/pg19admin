import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { type DbServiceCategoryFull, mapServiceCategoryFull } from '~~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const supabase = useSupabaseAdmin(event)

  let queryBuilder = supabase
    .from('service_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  // Фильтр по активности
  if (query.active === 'true') {
    queryBuilder = queryBuilder.eq('is_active', true)
  }
  else if (query.active === 'false') {
    queryBuilder = queryBuilder.eq('is_active', false)
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Failed to fetch categories:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке категорий',
    })
  }

  const categories = (data || []).map((item: DbServiceCategoryFull) => mapServiceCategoryFull(item))

  return { categories }
})
