import { requireAdmin } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID пользователя не указан'
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Получаем пользователя
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !user) {
    throw createError({
      statusCode: 404,
      message: 'Пользователь не найден'
    })
  }

  // Получаем связанные аккаунты
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, contract_number, contract_status, status, balance, address_full, date_created')
    .eq('user_id', id)
    .order('date_created', { ascending: false })

  return {
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      middleName: user.middle_name,
      fullName: user.full_name || `${user.last_name} ${user.first_name}`.trim(),
      email: user.email,
      phone: user.phone,
      birthDate: user.birth_date,
      avatar: user.avatar,
      nickname: user.nickname,
      status: user.status,
      telegram: user.telegram_id ? {
        id: user.telegram_id,
        username: user.telegram_username
      } : null,
      vkId: user.vk_id,
      onlineStatus: user.online_status,
      lastSeenAt: user.last_seen_at,
      notificationsSettings: user.notifications_settings,
      communityNotifications: user.community_notifications,
      passport: (user.passport_series || user.passport_number) ? {
        series: user.passport_series,
        number: user.passport_number
      } : null,
      registrationAddress: (user.reg_city || user.reg_street) ? {
        city: user.reg_city,
        street: user.reg_street,
        building: user.reg_building,
        apartment: user.reg_apartment
      } : null,
      createdAt: user.created_at,
      updatedAt: user.date_updated,
      accounts: (accounts || []).map(acc => ({
        id: acc.id,
        contractNumber: acc.contract_number,
        contractStatus: acc.contract_status,
        status: acc.status,
        balance: acc.balance,
        addressFull: acc.address_full,
        createdAt: acc.date_created
      }))
    }
  }
})
