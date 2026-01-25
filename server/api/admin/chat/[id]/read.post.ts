import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const chatId = getRouterParam(event, 'id')

  if (!chatId) {
    throw createError({
      statusCode: 400,
      message: 'ID чата обязателен',
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Используем функцию из миграции
  const { error } = await supabase.rpc('mark_chat_messages_read', {
    p_chat_id: chatId,
    p_reader_type: 'admin',
  })

  if (error) {
    console.error('Failed to mark messages as read:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при пометке сообщений',
    })
  }

  return { success: true }
})
