import { useSupabaseAdmin } from '~~/server/utils/supabase'

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
  } else if (query.active === 'false') {
    queryBuilder = queryBuilder.eq('is_active', false)
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Failed to fetch services:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке услуг'
    })
  }

  const services = (data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    fullDescription: item.full_description,
    priceMonthly: item.price_monthly,
    priceConnection: item.price_connection,
    imageUrl: item.image_url,
    features: item.features || [],
    sortOrder: item.sort_order,
    isActive: item.is_active,
    categoryId: item.category_id,
    category: item.category,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }))

  return { services }
})
