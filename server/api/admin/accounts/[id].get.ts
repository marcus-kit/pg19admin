import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID аккаунта не указан'
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Получаем аккаунт
  const { data: account, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !account) {
    throw createError({
      statusCode: 404,
      message: 'Аккаунт не найден'
    })
  }

  // Получаем данные пользователя если есть
  let user = null
  if (account.user_id) {
    const { data: userData } = await supabase
      .from('users')
      .select('id, first_name, last_name, full_name, email, phone, avatar, status')
      .eq('id', account.user_id)
      .single()

    if (userData) {
      user = {
        id: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        fullName: userData.full_name || `${userData.last_name} ${userData.first_name}`.trim(),
        email: userData.email,
        phone: userData.phone,
        avatar: userData.avatar,
        status: userData.status
      }
    }
  }

  return {
    account: {
      id: account.id,
      contractNumber: account.contract_number,
      contractStatus: account.contract_status,
      status: account.status,
      balance: account.balance,
      startDate: account.start_date,
      endDate: account.end_date,
      blockedAt: account.blocked_at,
      notes: account.notes,
      address: {
        full: account.address_full,
        city: account.address_city,
        district: account.address_district,
        street: account.address_street,
        building: account.address_building,
        apartment: account.address_apartment,
        entrance: account.address_entrance,
        floor: account.address_floor,
        intercom: account.address_intercom
      },
      user,
      createdAt: account.date_created,
      updatedAt: account.date_updated
    }
  }
})
