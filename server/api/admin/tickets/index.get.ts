import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { mapTicket, type DbTicket } from '~~/server/utils/mappers'

export default defineEventHandler(async (event) => {

  const query = getQuery(event)
  const status = query.status as string | undefined
  const priority = query.priority as string | undefined
  const assignedToMe = query.assignedToMe === 'true'
  const limit = Math.min(Number(query.limit) || 50, 100)
  const offset = Number(query.offset) || 0

  const supabase = useSupabaseAdmin(event)

  let queryBuilder = supabase
    .from('tickets')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status === 'in_progress') {
    queryBuilder = queryBuilder.in('status', ['open', 'pending'])
  } else if (status === 'closed') {
    queryBuilder = queryBuilder.in('status', ['resolved', 'closed'])
  } else if (status === 'all') {
    // All tickets - no filter
  } else if (status && ['new', 'open', 'pending', 'resolved'].includes(status)) {
    queryBuilder = queryBuilder.eq('status', status)
  } else {
    queryBuilder = queryBuilder.eq('status', 'new')
  }

  if (priority && ['low', 'normal', 'high', 'urgent'].includes(priority)) {
    queryBuilder = queryBuilder.eq('priority', priority)
  }

  if (assignedToMe) {
    queryBuilder = queryBuilder.eq('assigned_admin_id', admin.id)
  }

  const { data: tickets, error, count } = await queryBuilder

  if (error) {
    console.error('Failed to fetch tickets:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке тикетов'
    })
  }

  const adminIds = [...new Set(tickets.filter(t => t.assigned_admin_id).map(t => t.assigned_admin_id))]
  let adminsMap: Record<string, { id: string; fullName: string }> = {}

  if (adminIds.length > 0) {
    const { data: admins } = await supabase
      .from('admins')
      .select('id, full_name')
      .in('id', adminIds)

    if (admins) {
      adminsMap = Object.fromEntries(admins.map(a => [a.id, { id: a.id, fullName: a.full_name }]))
    }
  }

  return {
    tickets: (tickets as DbTicket[]).map(ticket =>
      mapTicket(ticket, ticket.assigned_admin_id ? adminsMap[ticket.assigned_admin_id] : null)
    ),
    total: count || 0,
    limit,
    offset
  }
})
