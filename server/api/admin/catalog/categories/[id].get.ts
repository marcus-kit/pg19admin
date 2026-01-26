import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { requireParam } from '~~/server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = requireParam(event, 'id', 'категории')
  const supabase = useSupabaseAdmin(event)

  const { data: category, error } = await supabase
    .from('service_categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !category) {
    throw createError({
      statusCode: 404,
      message: 'Категория не найдена',
    })
  }

  return {
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      sortOrder: category.sort_order,
      isActive: category.is_active,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    },
  }
})
