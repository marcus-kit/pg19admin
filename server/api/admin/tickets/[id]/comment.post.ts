import { requireAdmin } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

interface CommentBody {
  content: string
  isInternal?: boolean
  isSolution?: boolean
  attachments?: { url: string; name: string; size: number; type: string }[]
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const ticketId = getRouterParam(event, 'id')
  const body = await readBody<CommentBody>(event)

  if (!ticketId) {
    throw createError({
      statusCode: 400,
      message: 'ID тикета обязателен'
    })
  }

  if (!body.content?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Комментарий не может быть пустым'
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Проверяем, что тикет существует и не закрыт
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

  if (ticket.status === 'closed') {
    throw createError({
      statusCode: 400,
      message: 'Нельзя добавлять комментарии в закрытый тикет'
    })
  }

  // Создаём комментарий
  const { data: comment, error: commentError } = await supabase
    .from('ticket_comments')
    .insert({
      ticket_id: ticketId,
      author_type: 'admin',
      author_id: admin.id,
      author_name: admin.fullName,
      content: body.content.trim(),
      is_internal: body.isInternal || false,
      is_solution: body.isSolution || false,
      attachments: body.attachments || []
    })
    .select()
    .single()

  if (commentError) {
    console.error('Failed to create comment:', commentError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при добавлении комментария'
    })
  }

  // Если тикет был "new", переводим в "open"
  if (ticket.status === 'new') {
    await supabase
      .from('tickets')
      .update({ status: 'open' })
      .eq('id', ticketId)

    // Записываем в историю
    await supabase
      .from('ticket_history')
      .insert({
        ticket_id: ticketId,
        admin_id: admin.id,
        admin_name: admin.fullName,
        action: 'status_change',
        old_value: 'new',
        new_value: 'open'
      })
  }

  return {
    success: true,
    comment: {
      id: comment.id,
      ticketId: comment.ticket_id,
      authorType: comment.author_type,
      authorId: comment.author_id,
      authorName: comment.author_name,
      content: comment.content,
      isInternal: comment.is_internal,
      isSolution: comment.is_solution,
      createdAt: comment.created_at
    }
  }
})
