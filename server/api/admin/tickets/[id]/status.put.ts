import { requirePermission } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

interface StatusBody {
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed'
}

const VALID_STATUSES = ['new', 'open', 'pending', 'resolved', 'closed']

export default defineEventHandler(async (event) => {
  const admin = await requirePermission(event, 'tickets:respond')

  const ticketId = getRouterParam(event, 'id')
  const body = await readBody<StatusBody>(event)

  if (!ticketId) {
    throw createError({
      statusCode: 400,
      message: 'ID тикета обязателен'
    })
  }

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный статус'
    })
  }

  // Проверка прав на закрытие
  if (body.status === 'closed') {
    await requirePermission(event, 'tickets:close')
  }

  const supabase = useSupabaseAdmin()

  // Получаем текущий тикет
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id, status')
    .eq('id', ticketId)
    .single()

  if (ticketError || !ticket) {
    throw createError({
      statusCode: 404,
      message: 'Тикет не найден'
    })
  }

  if (ticket.status === body.status) {
    return { success: true, message: 'Статус не изменился' }
  }

  // Обновляем статус
  const updateData: Record<string, unknown> = { status: body.status }

  if (body.status === 'resolved' && !ticket.resolved_at) {
    updateData.resolved_at = new Date().toISOString()
  }

  if (body.status === 'closed') {
    updateData.closed_at = new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', ticketId)

  if (updateError) {
    console.error('Failed to update ticket status:', updateError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении статуса'
    })
  }

  // Записываем в историю
  await supabase
    .from('ticket_history')
    .insert({
      ticket_id: ticketId,
      admin_id: admin.id,
      admin_name: admin.fullName,
      action: 'status_change',
      old_value: ticket.status,
      new_value: body.status
    })

  return {
    success: true,
    oldStatus: ticket.status,
    newStatus: body.status
  }
})
