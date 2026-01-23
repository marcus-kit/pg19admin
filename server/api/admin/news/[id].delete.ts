import { requireAdmin } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID новости обязателен'
    })
  }

  const supabase = useSupabaseAdmin(event)

  // DELETE CASCADE автоматически удалит связанные news_attachments
  const { error } = await supabase
    .from('news')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete news:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при удалении новости'
    })
  }

  return {
    success: true
  }
})
