import { requireAdmin } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

interface CreateServiceData {
  name: string
  description?: string
  fullDescription?: string
  priceMonthly: number
  priceConnection?: number
  imageUrl?: string
  features?: string[]
  sortOrder?: number
  isActive?: boolean
  categoryId?: number
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<CreateServiceData>(event)

  if (!body.name?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Название услуги обязательно'
    })
  }

  if (body.priceMonthly === undefined || body.priceMonthly < 0) {
    throw createError({
      statusCode: 400,
      message: 'Укажите корректную ежемесячную стоимость'
    })
  }

  const supabase = useSupabaseAdmin(event)

  const { data, error } = await supabase
    .from('services')
    .insert({
      name: body.name,
      description: body.description || null,
      full_description: body.fullDescription || null,
      price_monthly: body.priceMonthly,
      price_connection: body.priceConnection || null,
      image_url: body.imageUrl || null,
      features: body.features || [],
      sort_order: body.sortOrder || 0,
      is_active: body.isActive ?? true,
      category_id: body.categoryId || null
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create service:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при создании услуги'
    })
  }

  return {
    success: true,
    service: {
      id: data.id,
      name: data.name
    }
  }
})
