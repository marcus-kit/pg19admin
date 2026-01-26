import { requireParam, requireEntity, throwSupabaseError } from '~~/server/utils/api-helpers'
import { getAdminFromEvent, useSupabaseAdmin } from '~~/server/utils/supabase'

interface AssignBody {
  adminId: string | null
}

export default defineEventHandler(async (event) => {
  const currentAdmin = await getAdminFromEvent(event)
  const ticketId = requireParam(event, 'id', 'тикета')
  const body = await readBody<AssignBody>(event)

  const supabase = useSupabaseAdmin(event)

  // Проверяем, что тикет существует
  await requireEntity(supabase, 'tickets', ticketId, 'Тикет')

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

  if (updateError) throwSupabaseError(updateError, 'назначении тикета')

  // Определяем действие для истории
  const action = body.adminId === null ? 'unassigned' : 'assigned'
  const newValue = body.adminId === null ? null : assignedAdminName

  // Записываем в историю
  await supabase
    .from('ticket_history')
    .insert({
      ticket_id: ticketId,
      admin_id: currentAdmin.id,
      admin_name: currentAdmin.fullName,
      action,
      old_value: null,
      new_value: newValue,
    })

  return {
    success: true,
    assignedAdminId: body.adminId,
    assignedAdminName,
  }
})
