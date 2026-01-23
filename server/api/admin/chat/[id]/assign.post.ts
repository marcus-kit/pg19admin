import { requirePermission } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

interface AssignBody {
  adminId: string | null // null для снятия назначения
}

export default defineEventHandler(async (event) => {
  const currentAdmin = await requirePermission(event, 'chat:respond')

  const chatId = getRouterParam(event, 'id')
  const body = await readBody<AssignBody>(event)

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
    .select('id, status, assigned_admin_id')
    .eq('id', chatId)
    .single()

  if (chatError || !chat) {
    throw createError({
      statusCode: 404,
      message: 'Чат не найден'
    })
  }

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
        message: 'Указанный администратор не найден'
      })
    }
    assignedAdminName = assignedAdmin.full_name
  }

  // Обновляем назначение
  const { error: updateError } = await supabase
    .from('chats')
    .update({ assigned_admin_id: body.adminId })
    .eq('id', chatId)

  if (updateError) {
    console.error('Failed to assign chat:', updateError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при назначении чата'
    })
  }

  // Добавляем системное сообщение
  const systemMessage = body.adminId === null
    ? `${currentAdmin.fullName} снял назначение с чата`
    : body.adminId === currentAdmin.id
      ? `${currentAdmin.fullName} взял чат себе`
      : `${currentAdmin.fullName} назначил чат на ${assignedAdminName}`

  await supabase
    .from('chat_messages')
    .insert({
      chat_id: chatId,
      sender_type: 'system',
      sender_id: currentAdmin.id,
      sender_name: currentAdmin.fullName,
      content: systemMessage,
      content_type: 'system',
      system_action: 'admin_assigned'
    })

  return {
    success: true,
    assignedAdminId: body.adminId,
    assignedAdminName
  }
})
