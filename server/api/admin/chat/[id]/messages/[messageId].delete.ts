import { requireParam, throwSupabaseError } from '~~/server/utils/api-helpers'
import { getAdminFromEvent, useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const admin = await getAdminFromEvent(event)
  const chatId = requireParam(event, 'id', 'чата')
  const messageId = requireParam(event, 'messageId', 'сообщения')

  const supabase = useSupabaseAdmin(event)

  // Проверяем, что сообщение существует и принадлежит админу
  const { data: message, error: messageError } = await supabase
    .from('chat_messages')
    .select('id, sender_type, sender_name, chat_id')
    .eq('id', messageId)
    .eq('chat_id', chatId)
    .single()

  if (messageError || !message) {
    throw createError({
      statusCode: 404,
      message: 'Сообщение не найдено',
    })
  }

  // Проверяем, что это сообщение админа
  if (message.sender_type !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Можно удалять только свои сообщения',
    })
  }

  // Проверяем, что это сообщение текущего админа (по имени)
  if (message.sender_name !== admin.fullName) {
    throw createError({
      statusCode: 403,
      message: 'Можно удалять только свои сообщения',
    })
  }

  // Удаляем сообщение
  const { error: deleteError } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId)

  if (deleteError) throwSupabaseError(deleteError, 'удалении сообщения')

  return {
    success: true,
  }
})
