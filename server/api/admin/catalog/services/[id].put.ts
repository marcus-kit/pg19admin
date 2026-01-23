import { useSupabaseAdmin } from '~~/server/utils/supabase'

interface UpdateServiceData {
  name?: string
  description?: string
  fullDescription?: string
  priceMonthly?: number
  priceConnection?: number
  imageUrl?: string
  features?: string[]
  sortOrder?: number
  isActive?: boolean
  categoryId?: number | null
}

export default defineEventHandler(async (event) => {

  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateServiceData>(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID услуги обязателен'
    })
  }

  const supabase = useSupabaseAdmin(event)

  const dbData: Record<string, unknown> = {}

  if (body.name !== undefined) dbData.name = body.name
  if (body.description !== undefined) dbData.description = body.description
  if (body.fullDescription !== undefined) dbData.full_description = body.fullDescription
  if (body.priceMonthly !== undefined) dbData.price_monthly = body.priceMonthly
  if (body.priceConnection !== undefined) dbData.price_connection = body.priceConnection
  if (body.imageUrl !== undefined) dbData.image_url = body.imageUrl
  if (body.features !== undefined) dbData.features = body.features
  if (body.sortOrder !== undefined) dbData.sort_order = body.sortOrder
  if (body.isActive !== undefined) dbData.is_active = body.isActive
  if (body.categoryId !== undefined) dbData.category_id = body.categoryId

  if (Object.keys(dbData).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Нет данных для обновления'
    })
  }

  const { data, error } = await supabase
    .from('services')
    .update(dbData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update service:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении услуги'
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
