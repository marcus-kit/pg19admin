import { requireParam, requireEntity, throwSupabaseError } from '~~/server/utils/api-helpers'
import { getAdminFromEvent, useSupabaseAdmin } from '~~/server/utils/supabase'

interface SendMessageBody {
  content: string
  contentType?: 'text' | 'image' | 'file'
  attachmentUrl?: string
  attachmentName?: string
  attachmentSize?: number
}

export default defineEventHandler(async (event) => {
  const admin = await getAdminFromEvent(event)
  const chatId = requireParam(event, 'id', 'чата')
  const body = await readBody<SendMessageBody>(event)

  // Сообщение обязательно только если нет вложения
  if (!body.content?.trim() && !body.attachmentUrl) {
    throw createError({
      statusCode: 400,
      message: 'Сообщение или вложение обязательно',
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Проверяем, что чат существует и не закрыт
  const chat = await requireEntity<{ id: string, status: string }>(
    supabase,
    'chats',
    chatId,
    'Чат',
    'id, status',
  )

  if (chat.status === 'closed') {
    throw createError({
      statusCode: 400,
      message: 'Нельзя отправлять сообщения в закрытый чат',
    })
  }

  // Создаём сообщение (sender_id = null для админов, т.к. FK на users, а не auth.users)
  const { data: message, error: messageError } = await supabase
    .from('chat_messages')
    .insert({
      chat_id: chatId,
      sender_type: 'admin',
      sender_id: null,
      sender_name: admin.fullName,
      content: body.content?.trim() || '',
      content_type: body.contentType || 'text',
      attachment_url: body.attachmentUrl || null,
      attachment_name: body.attachmentName || null,
      attachment_size: body.attachmentSize || null,
    })
    .select()
    .single()

  if (messageError) throwSupabaseError(messageError, 'отправке сообщения')

  // Если чат был в статусе "waiting", переводим в "active"
  if (chat.status === 'waiting') {
    await supabase
      .from('chats')
      .update({ status: 'active' })
      .eq('id', chatId)
  }

  return {
    success: true,
    message: {
      id: message.id,
      chatId: message.chat_id,
      senderType: message.sender_type,
      senderId: message.sender_id,
      senderName: message.sender_name,
      content: message.content,
      contentType: message.content_type,
      createdAt: message.created_at,
    },
  }
})
