import { requirePermission } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { mapAccount, mapUserShort, type DbAccount, type DbUser } from '~~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'accounts:read')

  const query = getQuery(event)

  const status = query.status as string | undefined
  const contractStatus = query.contractStatus as string | undefined
  const userId = query.userId as string | undefined
  const search = query.search as string | undefined
  const limit = Math.min(Number(query.limit) || 50, 100)
  const offset = Number(query.offset) || 0

  const supabase = useSupabaseAdmin()

  // Базовый запрос
  let queryBuilder = supabase
    .from('accounts')
    .select('*', { count: 'exact' })
    .order('date_created', { ascending: false })
    .range(offset, offset + limit - 1)

  // Фильтр по статусу аккаунта
  if (status && ['active', 'blocked', 'closed'].includes(status)) {
    queryBuilder = queryBuilder.eq('status', status)
  }

  // Фильтр по статусу договора
  if (contractStatus && ['draft', 'active', 'terminated', 'stopped'].includes(contractStatus)) {
    queryBuilder = queryBuilder.eq('contract_status', contractStatus)
  }

  // Фильтр по пользователю
  if (userId) {
    queryBuilder = queryBuilder.eq('user_id', userId)
  }

  // Поиск по номеру договора или адресу
  if (search && search.trim()) {
    const searchTerm = search.trim()
    // Если число - ищем по номеру договора
    if (/^\d+$/.test(searchTerm)) {
      queryBuilder = queryBuilder.eq('contract_number', parseInt(searchTerm))
    } else {
      // Иначе ищем по адресу
      queryBuilder = queryBuilder.ilike('address_full', `%${searchTerm}%`)
    }
  }

  const { data: accounts, error, count } = await queryBuilder

  if (error) {
    console.error('Failed to fetch accounts:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке аккаунтов'
    })
  }

  // Получаем данные пользователей
  const userIds = [...new Set(accounts.filter(a => a.user_id).map(a => a.user_id))]
  let usersMap: Record<string, { id: string; fullName: string }> = {}

  if (userIds.length > 0) {
    type UserShort = Pick<DbUser, 'id' | 'first_name' | 'last_name' | 'full_name'>
    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name, full_name')
      .in('id', userIds)

    if (users) {
      usersMap = Object.fromEntries(
        (users as UserShort[]).map(u => [u.id, mapUserShort(u)])
      )
    }
  }

  return {
    accounts: (accounts as DbAccount[]).map(acc =>
      mapAccount(acc, acc.user_id ? usersMap[acc.user_id] : null)
    ),
    total: count || 0,
    limit,
    offset
  }
})
