import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { requirePermission } from '~~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  // Проверка авторизации и прав
  await requirePermission(event, 'pages:delete')

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID страницы обязателен'
    })
  }

  const supabase = useSupabaseAdmin()

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
