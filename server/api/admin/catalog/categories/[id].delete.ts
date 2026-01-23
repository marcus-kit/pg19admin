import { requireAdmin } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID категории обязателен'
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Проверяем, есть ли услуги в этой категории
  const { count } = await supabase
    .from('services')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)

  if (count && count > 0) {
    throw createError({
      statusCode: 400,
      message: `Нельзя удалить категорию: в ней ${count} услуг(и)`
    })
  }

  const { error } = await supabase
    .from('service_categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete category:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при удалении категории'
    })
  }

  return { success: true }
})
