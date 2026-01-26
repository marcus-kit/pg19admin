import { requireParam, requireEntity, throwSupabaseError } from '~~/server/utils/api-helpers'
import { getAdminFromEvent, useSupabaseAdmin } from '~~/server/utils/supabase'

interface AssignBody {
  adminId: string | null // null для снятия назначения
}

export default defineEventHandler(async (event) => {
  const currentAdmin = await getAdminFromEvent(event)
  const chatId = requireParam(event, 'id', 'чата')
  const body = await readBody<AssignBody>(event)

  const supabase = useSupabaseAdmin(event)

  // Проверяем, что чат существует
  await requireEntity(supabase, 'chats', chatId, 'Чат')

  // Если назначаем на другого админа, проверяем что он существует
  let assignedAdminName = null
  if (body.adminId !== null) {
    const { data: assignedAdmin, error: adminError } = await supabase
      .from('admins')
      .select('id, full_name')
      .eq('id', body.adminId)
      .single()

    if (adminError || !assignedAdmin) {
      throw createError({
        statusCode: 400,
        message: 'Указанный администратор не найден',
      })
    }
    assignedAdminName = assignedAdmin.full_name
  }

  // Обновляем назначение
  const { error: updateError } = await supabase
    .from('chats')
    .update({ assigned_admin_id: body.adminId })
    .eq('id', chatId)

  if (updateError) throwSupabaseError(updateError, 'назначении чата')

  // Добавляем системное сообщение
  let systemMessage: string
  if (body.adminId === null) {
    systemMessage = `${currentAdmin.fullName} снял назначение с чата`
  }
  else if (body.adminId === currentAdmin.id) {
    systemMessage = `${currentAdmin.fullName} взял чат себе`
  }
  else {
    systemMessage = `${currentAdmin.fullName} назначил чат на ${assignedAdminName}`
  }

  await supabase
    .from('chat_messages')
    .insert({
      chat_id: chatId,
      sender_type: 'system',
      sender_id: currentAdmin.id,
      sender_name: currentAdmin.fullName,
      content: systemMessage,
      content_type: 'system',
      system_action: 'admin_assigned',
    })

  return {
    success: true,
    assignedAdminId: body.adminId,
    assignedAdminName,
  }
})
