import { getAdminFromEvent, useSupabaseAdmin } from '~~/server/utils/supabase'
import { mapChat, type DbChat } from '~~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const admin = await getAdminFromEvent(event)
  const query = getQuery(event)
  const status = query.status as string | undefined
  const assignedToMe = query.assignedToMe === 'true'

  const supabase = useSupabaseAdmin(event)

  let queryBuilder = supabase
    .from('chats')
    .select(`
      *,
      assigned_admin:admins!assigned_admin_id(id, full_name)
    `)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (status && ['active', 'waiting', 'closed'].includes(status)) {
    queryBuilder = queryBuilder.eq('status', status)
  }
  else {
    queryBuilder = queryBuilder.in('status', ['active', 'waiting'])
  }

  if (assignedToMe) {
    queryBuilder = queryBuilder.eq('assigned_admin_id', admin.id)
  }

  const { data: chats, error } = await queryBuilder.limit(100)

  if (error) {
    console.error('Failed to fetch chats:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке чатов',
    })
  }

  return {
    chats: (chats as DbChat[]).map(mapChat),
  }
})
