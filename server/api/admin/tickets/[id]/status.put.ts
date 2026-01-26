import { requireParam, requireEntity, throwSupabaseError } from '~~/server/utils/api-helpers'
import { getAdminFromEvent, useSupabaseAdmin } from '~~/server/utils/supabase'

interface StatusBody {
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed'
}

const VALID_STATUSES = ['new', 'open', 'pending', 'resolved', 'closed']

export default defineEventHandler(async (event) => {
  const admin = await getAdminFromEvent(event)
  const ticketId = requireParam(event, 'id', 'тикета')
  const body = await readBody<StatusBody>(event)

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный статус',
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Получаем текущий тикет
  const ticket = await requireEntity<{ id: string, status: string }>(
    supabase,
    'tickets',
    ticketId,
    'Тикет',
    'id, status',
  )

  if (ticket.status === body.status) {
    return { success: true, message: 'Статус не изменился' }
  }

  // Обновляем статус
  const updateData: Record<string, unknown> = { status: body.status }

  if (body.status === 'resolved') {
    updateData.resolved_at = new Date().toISOString()
  }

  if (body.status === 'closed') {
    updateData.closed_at = new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', ticketId)

  if (updateError) throwSupabaseError(updateError, 'обновлении статуса')

  // Записываем в историю
  await supabase
    .from('ticket_history')
    .insert({
      ticket_id: ticketId,
      admin_id: admin.id,
      admin_name: admin.fullName,
      action: 'status_change',
      old_value: ticket.status,
      new_value: body.status,
    })

  return {
    success: true,
    oldStatus: ticket.status,
    newStatus: body.status,
  }
})
