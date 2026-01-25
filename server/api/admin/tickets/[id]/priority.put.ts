import { getAdminFromEvent, useSupabaseAdmin } from '~~/server/utils/supabase'

interface PriorityBody {
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent']

export default defineEventHandler(async (event) => {
  const admin = await getAdminFromEvent(event)
  const ticketId = getRouterParam(event, 'id')
  const body = await readBody<PriorityBody>(event)

  if (!ticketId) {
    throw createError({
      statusCode: 400,
      message: 'ID тикета обязателен',
    })
  }

  if (!body.priority || !VALID_PRIORITIES.includes(body.priority)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный приоритет',
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Получаем текущий тикет
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id, priority')
    .eq('id', ticketId)
    .single()

  if (ticketError || !ticket) {
    throw createError({
      statusCode: 404,
      message: 'Тикет не найден',
    })
  }

  if (ticket.priority === body.priority) {
    return { success: true, message: 'Приоритет не изменился' }
  }

  // Обновляем приоритет
  const { error: updateError } = await supabase
    .from('tickets')
    .update({ priority: body.priority })
    .eq('id', ticketId)

  if (updateError) {
    console.error('Failed to update ticket priority:', updateError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении приоритета',
    })
  }

  // Записываем в историю
  await supabase
    .from('ticket_history')
    .insert({
      ticket_id: ticketId,
      admin_id: admin.id,
      admin_name: admin.fullName,
      action: 'priority_change',
      old_value: ticket.priority,
      new_value: body.priority,
    })

  return {
    success: true,
    oldPriority: ticket.priority,
    newPriority: body.priority,
  }
})
