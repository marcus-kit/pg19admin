import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { type DbServiceWithCategory, mapServiceWithCategory } from '~~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const supabase = useSupabaseAdmin(event)

  let queryBuilder = supabase
    .from('services')
    .select(`
      *,
      category:service_categories(id, name, slug)
    `)
    .order('sort_order', { ascending: true })

  // Фильтр по категории
  if (query.categoryId) {
    queryBuilder = queryBuilder.eq('category_id', query.categoryId)
  }

  // Фильтр по активности
  if (query.active === 'true') {
    queryBuilder = queryBuilder.eq('is_active', true)
  }
  else if (query.active === 'false') {
    queryBuilder = queryBuilder.eq('is_active', false)
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Failed to fetch services:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке услуг',
    })
  }

  const services = (data || []).map((item: DbServiceWithCategory) => mapServiceWithCategory(item))

  return { services }
})
