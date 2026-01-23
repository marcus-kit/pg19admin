import { requirePermission } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'chat:read')

  const id = getRouterParam(event, 'id')
  const query = getQuery(event)

  const limit = Math.min(Number(query.limit) || 50, 100)
  const before = query.before as string | undefined // cursor для пагинации

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID чата обязателен'
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Получаем чат
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select(`
      *,
      assigned_admin:admins!assigned_admin_id(id, full_name, email)
    `)
    .eq('id', id)
    .single()

  if (chatError || !chat) {
    throw createError({
      statusCode: 404,
      message: 'Чат не найден'
    })
  }

  // Получаем сообщения
  let messagesQuery = supabase
    .from('chat_messages')
    .select('*')
    .eq('chat_id', id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) {
    messagesQuery = messagesQuery.lt('created_at', before)
  }

  const { data: messages, error: messagesError } = await messagesQuery

  if (messagesError) {
    console.error('Failed to fetch messages:', messagesError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке сообщений'
    })
  }

  return {
    chat: {
      id: chat.id,
      userId: chat.user_id,
      userName: chat.user_name || chat.guest_name,
      guestName: chat.guest_name,
      guestContact: chat.guest_contact,
      userTelegramId: chat.user_telegram_id,
      status: chat.status,
      subject: chat.subject,
      assignedAdmin: chat.assigned_admin,
      unreadAdminCount: chat.unread_admin_count,
      unreadUserCount: chat.unread_user_count,
      lastMessageAt: chat.last_message_at,
      createdAt: chat.created_at,
      closedAt: chat.closed_at,
      metadata: chat.metadata
    },
    messages: messages.reverse().map(msg => ({
      id: msg.id,
      chatId: msg.chat_id,
      senderType: msg.sender_type,
      senderId: msg.sender_id,
      senderName: msg.sender_name,
      content: msg.content,
      contentType: msg.content_type,
      attachmentUrl: msg.attachment_url,
      attachmentName: msg.attachment_name,
      attachmentSize: msg.attachment_size,
      isRead: msg.is_read,
      readAt: msg.read_at,
      createdAt: msg.created_at,
      editedAt: msg.edited_at,
      systemAction: msg.system_action
    })),
    hasMore: messages.length === limit
  }
})
