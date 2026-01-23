import { requirePermission } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'catalog:read')

  const query = getQuery(event)
  const supabase = useSupabaseAdmin(event)

  let queryBuilder = supabase
    .from('service_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  // Фильтр по активности
  if (query.active === 'true') {
    queryBuilder = queryBuilder.eq('is_active', true)
  } else if (query.active === 'false') {
    queryBuilder = queryBuilder.eq('is_active', false)
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Failed to fetch categories:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке категорий'
    })
  }

  const categories = (data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    icon: item.icon,
    sortOrder: item.sort_order,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }))

  return { categories }
})
