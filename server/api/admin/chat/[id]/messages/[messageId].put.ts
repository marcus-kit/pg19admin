import { requireParam, throwSupabaseError } from '~~/server/utils/api-helpers'
import { getAdminFromEvent, useSupabaseAdmin } from '~~/server/utils/supabase'

interface UpdateMessageBody {
  content: string
}

export default defineEventHandler(async (event) => {
  const admin = await getAdminFromEvent(event)
  const chatId = requireParam(event, 'id', 'чата')
  const messageId = requireParam(event, 'messageId', 'сообщения')
  const body = await readBody<UpdateMessageBody>(event)

  if (!body.content?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Сообщение не может быть пустым',
    })
  }

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
      message: 'Можно редактировать только свои сообщения',
    })
  }

  // Проверяем, что это сообщение текущего админа (по имени)
  if (message.sender_name !== admin.fullName) {
    throw createError({
      statusCode: 403,
      message: 'Можно редактировать только свои сообщения',
    })
  }

  // Обновляем сообщение
  const { data: updatedMessage, error: updateError } = await supabase
    .from('chat_messages')
    .update({
      content: body.content.trim(),
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select()
    .single()

  if (updateError) throwSupabaseError(updateError, 'редактировании сообщения')

  return {
    success: true,
    message: {
      id: updatedMessage.id,
      chatId: updatedMessage.chat_id,
      senderType: updatedMessage.sender_type,
      senderId: updatedMessage.sender_id,
      senderName: updatedMessage.sender_name,
      content: updatedMessage.content,
      contentType: updatedMessage.content_type,
      attachmentUrl: updatedMessage.attachment_url,
      attachmentName: updatedMessage.attachment_name,
      attachmentSize: updatedMessage.attachment_size,
      isRead: updatedMessage.is_read,
      createdAt: updatedMessage.created_at,
      editedAt: updatedMessage.edited_at,
    },
  }
})
