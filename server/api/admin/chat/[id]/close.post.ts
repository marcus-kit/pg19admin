import { requireParam, requireEntity, throwSupabaseError } from '~~/server/utils/api-helpers'
import { getAdminFromEvent, useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const admin = await getAdminFromEvent(event)
  const chatId = requireParam(event, 'id', 'чата')

  const supabase = useSupabaseAdmin(event)

  // Проверяем, что чат существует
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
      message: 'Чат уже закрыт',
    })
  }

  // Закрываем чат
  const { error: updateError } = await supabase
    .from('chats')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
    })
    .eq('id', chatId)

  if (updateError) throwSupabaseError(updateError, 'закрытии чата')

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
      system_action: 'chat_closed',
    })

  return { success: true }
})
