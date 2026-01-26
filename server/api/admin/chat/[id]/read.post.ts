import { requireParam, throwSupabaseError } from '~~/server/utils/api-helpers'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const chatId = requireParam(event, 'id', 'чата')

  const supabase = useSupabaseAdmin(event)

  // Используем функцию из миграции
  const { error } = await supabase.rpc('mark_chat_messages_read', {
    p_chat_id: chatId,
    p_reader_type: 'admin',
  })

  if (error) throwSupabaseError(error, 'пометке сообщений')

  return { success: true }
})
