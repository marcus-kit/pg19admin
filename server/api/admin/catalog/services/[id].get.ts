import { requireAdmin } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID услуги обязателен'
    })
  }

  const supabase = useSupabaseAdmin(event)

  const { data: service, error } = await supabase
    .from('services')
    .select(`
      *,
      category:service_categories(id, name, slug)
    `)
    .eq('id', id)
    .single()

  if (error || !service) {
    throw createError({
      statusCode: 404,
      message: 'Услуга не найдена'
    })
  }

  return {
    service: {
      id: service.id,
      name: service.name,
      description: service.description,
      fullDescription: service.full_description,
      priceMonthly: service.price_monthly,
      priceConnection: service.price_connection,
      imageUrl: service.image_url,
      features: service.features || [],
      sortOrder: service.sort_order,
      isActive: service.is_active,
      categoryId: service.category_id,
      category: service.category,
      createdAt: service.created_at,
      updatedAt: service.updated_at
    }
  }
})
