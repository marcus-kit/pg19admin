import { getAdminFromEvent, useSupabaseAdmin } from '~~/server/utils/supabase'

interface AssignBody {
  adminId: string | null
}

export default defineEventHandler(async (event) => {
  const currentAdmin = await getAdminFromEvent(event)
  const ticketId = getRouterParam(event, 'id')
  const body = await readBody<AssignBody>(event)

  if (!ticketId) {
    throw createError({
      statusCode: 400,
      message: 'ID тикета обязателен',
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Проверяем, что тикет существует
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id, assigned_admin_id')
    .eq('id', ticketId)
    .single()

  if (ticketError || !ticket) {
    throw createError({
      statusCode: 404,
      message: 'Тикет не найден',
    })
  }

  // Если назначаем на админа, проверяем что он существует
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
    .from('tickets')
    .update({ assigned_admin_id: body.adminId })
    .eq('id', ticketId)

  if (updateError) {
    console.error('Failed to assign ticket:', updateError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при назначении тикета',
    })
  }

  // Определяем действие для истории
  let action = 'assigned'
  const oldValue = null
  let newValue = assignedAdminName

  if (body.adminId === null) {
    action = 'unassigned'
    newValue = null
  }

  // Записываем в историю
  await supabase
    .from('ticket_history')
    .insert({
      ticket_id: ticketId,
      admin_id: currentAdmin.id,
      admin_name: currentAdmin.fullName,
      action,
      old_value: oldValue,
      new_value: newValue,
    })

  return {
    success: true,
    assignedAdminId: body.adminId,
    assignedAdminName,
  }
})
