import { requirePermission } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { mapUser, type DbUser } from '~~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'users:read')

  const query = getQuery(event)

  const status = query.status as string | undefined
  const search = query.search as string | undefined
  const limit = Math.min(Number(query.limit) || 50, 100)
  const offset = Number(query.offset) || 0

  const supabase = useSupabaseAdmin(event)

  // Базовый запрос
  let queryBuilder = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Фильтр по статусу
  if (status && ['active', 'suspended', 'terminated'].includes(status)) {
    queryBuilder = queryBuilder.eq('status', status)
  }

  // Поиск по имени, телефону, email, telegram
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`
    queryBuilder = queryBuilder.or(
      `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},full_name.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm},telegram_username.ilike.${searchTerm}`
    )
  }

  const { data: users, error, count } = await queryBuilder

  if (error) {
    console.error('Failed to fetch users:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке пользователей'
    })
  }

  // Получаем количество аккаунтов для каждого пользователя
  const userIds = users.map(u => u.id)
  let accountsCounts: Record<string, number> = {}

  if (userIds.length > 0) {
    const { data: accountsData } = await supabase
      .from('accounts')
      .select('user_id')
      .in('user_id', userIds)

    if (accountsData) {
      accountsCounts = accountsData.reduce((acc, a) => {
        acc[a.user_id] = (acc[a.user_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  return {
    users: (users as DbUser[]).map(user => mapUser(user, accountsCounts[user.id])),
    total: count || 0,
    limit,
    offset
  }
})
