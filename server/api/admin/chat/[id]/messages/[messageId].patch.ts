import { requireParam, throwSupabaseError } from '~~/server/utils/api-helpers'
import { getAdminFromEvent, useSupabaseAdmin } from '~~/server/utils/supabase'

interface EditMessageBody {
  content: string
}

export default defineEventHandler(async (event) => {
  await getAdminFromEvent(event)
  const chatId = requireParam(event, 'id', 'чата')
  const messageId = requireParam(event, 'messageId', 'сообщения')

  const body = await readBody<EditMessageBody>(event)
  const content = body.content?.trim()
  if (!content) {
    throw createError({
      statusCode: 400,
      message: 'Текст сообщения не может быть пустым',
    })
  }

  const supabase = useSupabaseAdmin(event)

  const { data: message, error: fetchError } = await supabase
    .from('chat_messages')
    .select('id, chat_id, sender_type, content_type')
    .eq('id', messageId)
    .eq('chat_id', chatId)
    .single()

  if (fetchError || !message) {
    throw createError({
      statusCode: 404,
      message: 'Сообщение не найдено',
    })
  }

  if (message.sender_type !== 'admin' && message.sender_type !== 'bot') {
    throw createError({
      statusCode: 403,
      message: 'Редактировать можно только сообщения оператора и бота',
    })
  }

  const { data: updated, error: updateError } = await supabase
    .from('chat_messages')
    .update({
      content,
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('chat_id', chatId)
    .select()
    .single()

  if (updateError) throwSupabaseError(updateError, 'редактировании сообщения')

  return {
    message: {
      id: updated.id,
      chatId: updated.chat_id,
      senderType: updated.sender_type,
      senderId: updated.sender_id,
      senderName: updated.sender_name,
      content: updated.content,
      attachmentUrl: updated.attachment_url,
      attachmentName: updated.attachment_name,
      attachmentSize: updated.attachment_size,
      isRead: updated.is_read,
      createdAt: updated.created_at,
      editedAt: updated.edited_at,
    },
  }
})
