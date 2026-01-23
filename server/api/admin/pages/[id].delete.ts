import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  // Проверка авторизации и прав

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
