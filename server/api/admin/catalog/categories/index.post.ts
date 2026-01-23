import { requireAdmin } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

interface CreateCategoryData {
  name: string
  slug: string
  description?: string
  icon?: string
  sortOrder?: number
  isActive?: boolean
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<CreateCategoryData>(event)

  if (!body.name?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Название категории обязательно'
    })
  }

  if (!body.slug?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'URL (slug) обязателен'
    })
  }

  const slug = body.slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const supabase = useSupabaseAdmin(event)

  // Проверяем уникальность slug
  const { data: existing } = await supabase
    .from('service_categories')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    throw createError({
      statusCode: 400,
      message: 'Категория с таким URL уже существует'
    })
  }

  const { data, error } = await supabase
    .from('service_categories')
    .insert({
      name: body.name,
      slug,
      description: body.description || null,
      icon: body.icon || null,
      sort_order: body.sortOrder || 0,
      is_active: body.isActive ?? true
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create category:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при создании категории'
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
