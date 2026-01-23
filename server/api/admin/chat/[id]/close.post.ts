import { requireAdmin } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const chatId = getRouterParam(event, 'id')

  if (!chatId) {
    throw createError({
      statusCode: 400,
      message: 'ID чата обязателен'
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Проверяем, что чат существует
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('id, status')
    .eq('id', chatId)
    .single()

  if (chatError || !chat) {
    throw createError({
      statusCode: 404,
      message: 'Чат не найден'
    })
  }

  if (chat.status === 'closed') {
    throw createError({
      statusCode: 400,
      message: 'Чат уже закрыт'
    })
  }

  // Закрываем чат
  const { error: updateError } = await supabase
    .from('chats')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString()
    })
    .eq('id', chatId)

  if (updateError) {
    console.error('Failed to close chat:', updateError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при закрытии чата'
    })
  }

  // Добавляем системное сообщение (sender_id = null, т.к. FK на users)
  await supabase
    .from('chat_messages')
    .insert({
      chat_id: chatId,
      sender_type: 'system',
      sender_id: null,
      sender_name: admin.fullName,
      content: `Чат закрыт оператором ${admin.fullName}`,
      content_type: 'system',
      system_action: 'chat_closed'
    })

  return { success: true }
})
