import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID тикета обязателен'
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Получаем тикет
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single()

  if (ticketError || !ticket) {
    console.error('Ticket fetch error:', ticketError, 'ID:', id)
    throw createError({
      statusCode: 404,
      message: 'Тикет не найден'
    })
  }

  // Получаем назначенного админа отдельно (нет FK constraint)
  let assignedAdmin = null
  if (ticket.assigned_admin_id) {
    const { data: admin } = await supabase
      .from('admins')
      .select('id, full_name, email')
      .eq('id', ticket.assigned_admin_id)
      .single()
    assignedAdmin = admin
  }

  // Получаем комментарии
  const { data: comments, error: commentsError } = await supabase
    .from('ticket_comments')
    .select('*')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  if (commentsError) {
    console.error('Failed to fetch comments:', commentsError)
  }

  // Получаем историю изменений
  const { data: history, error: historyError } = await supabase
    .from('ticket_history')
    .select('*')
    .eq('ticket_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (historyError) {
    console.error('Failed to fetch history:', historyError)
  }

  return {
    ticket: {
      id: ticket.id,
      number: ticket.number,
      userId: ticket.user_id,
      userName: ticket.user_name,
      userEmail: ticket.user_email,
      userPhone: ticket.user_phone,
      userTelegramId: ticket.user_telegram_id,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      status: ticket.status,
      priority: ticket.priority,
      assignedAdmin,
      relatedServiceId: ticket.related_service_id,
      relatedSubscriptionId: ticket.related_subscription_id,
      tags: ticket.tags,
      metadata: ticket.metadata,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      firstResponseAt: ticket.first_response_at,
      resolvedAt: ticket.resolved_at,
      closedAt: ticket.closed_at,
      slaDeadline: ticket.sla_deadline
    },
    comments: (comments || []).map(c => ({
      id: c.id,
      ticketId: c.ticket_id,
      authorType: c.author_type,
      authorId: c.author_id,
      authorName: c.author_name,
      content: c.content,
      isInternal: c.is_internal,
      isSolution: c.is_solution,
      attachments: c.attachments,
      createdAt: c.created_at,
      editedAt: c.edited_at
    })),
    history: (history || []).map(h => ({
      id: h.id,
      adminName: h.admin_name,
      action: h.action,
      oldValue: h.old_value,
      newValue: h.new_value,
      createdAt: h.created_at
    }))
  }
})
