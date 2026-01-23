import { useSupabaseAdmin } from '~~/server/utils/supabase'

interface UpdateCategoryData {
  name?: string
  slug?: string
  description?: string
  icon?: string
  sortOrder?: number
  isActive?: boolean
}

export default defineEventHandler(async (event) => {

  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateCategoryData>(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID категории обязателен'
    })
  }

  const supabase = useSupabaseAdmin(event)

  const dbData: Record<string, unknown> = {}

  if (body.name !== undefined) dbData.name = body.name
  if (body.description !== undefined) dbData.description = body.description
  if (body.icon !== undefined) dbData.icon = body.icon
  if (body.sortOrder !== undefined) dbData.sort_order = body.sortOrder
  if (body.isActive !== undefined) dbData.is_active = body.isActive

  if (body.slug !== undefined) {
    const slug = body.slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    // Проверяем уникальность
    const { data: existing } = await supabase
      .from('service_categories')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single()

    if (existing) {
      throw createError({
        statusCode: 400,
        message: 'Категория с таким URL уже существует'
      })
    }

    dbData.slug = slug
  }

  if (Object.keys(dbData).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Нет данных для обновления'
    })
  }

  const { data, error } = await supabase
    .from('service_categories')
    .update(dbData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update category:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении категории'
    })
  }

  return {
    success: true,
    category: {
      id: data.id,
      name: data.name,
      slug: data.slug
    }
  }
})
