import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { requireAdmin } from '~~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  // Проверка авторизации и прав
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID страницы обязателен'
    })
  }

  const supabase = useSupabaseAdmin(event)

  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete page:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при удалении страницы'
    })
  }

  return {
    success: true
  }
})
