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

  if (chat.status !== 'closed') {
    throw createError({
      statusCode: 400,
      message: 'Чат не закрыт',
    })
  }

  // Открываем чат (ставим статус active)
  const { error: updateError } = await supabase
    .from('chats')
    .update({
      status: 'active',
      closed_at: null,
    })
    .eq('id', chatId)

  if (updateError) throwSupabaseError(updateError, 'открытии чата')

  // Добавляем системное сообщение
  await supabase
    .from('chat_messages')
    .insert({
      chat_id: chatId,
      sender_type: 'system',
      sender_id: null,
      sender_name: admin.fullName,
      content: `Чат открыт оператором ${admin.fullName}`,
      content_type: 'system',
      system_action: 'chat_opened',
    })

  return { success: true }
})
