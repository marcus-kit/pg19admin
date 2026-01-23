import { requirePermission } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'accounts:create')

  const body = await readBody(event)
  const supabase = useSupabaseAdmin(event)

  // Собираем данные для вставки
  const insertData: Record<string, any> = {}

  // Привязка к пользователю (опционально)
  if (body.userId) {
    // Проверяем существование пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', body.userId)
      .single()

    if (userError || !user) {
      throw createError({
        statusCode: 400,
        message: 'Пользователь не найден'
      })
    }
    insertData.user_id = body.userId
  }

  // Данные договора
  if (body.contractNumber !== undefined && body.contractNumber !== null) {
    insertData.contract_number = body.contractNumber
  }
  if (body.contractStatus) {
    if (!['draft', 'active', 'terminated', 'stopped'].includes(body.contractStatus)) {
      throw createError({
        statusCode: 400,
        message: 'Некорректный статус договора'
      })
    }
    insertData.contract_status = body.contractStatus
  }
  if (body.startDate) insertData.start_date = body.startDate
  if (body.endDate) insertData.end_date = body.endDate
  if (body.notes?.trim()) insertData.notes = body.notes.trim()

  // Адрес (address_full генерируется автоматически триггером)
  if (body.address) {
    if (body.address.city?.trim()) insertData.address_city = body.address.city.trim()
    if (body.address.district?.trim()) insertData.address_district = body.address.district.trim()
    if (body.address.street?.trim()) insertData.address_street = body.address.street.trim()
    if (body.address.building?.trim()) insertData.address_building = body.address.building.trim()
    if (body.address.apartment?.trim()) insertData.address_apartment = body.address.apartment.trim()
    if (body.address.entrance?.trim()) insertData.address_entrance = body.address.entrance.trim()
    if (body.address.floor?.trim()) insertData.address_floor = body.address.floor.trim()
    if (body.address.intercom?.trim()) insertData.address_intercom = body.address.intercom.trim()
  }

  const { data: newAccount, error } = await supabase
    .from('accounts')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Failed to create account:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при создании аккаунта'
    })
  }

  return {
    success: true,
    account: {
      id: newAccount.id,
      contractNumber: newAccount.contract_number,
      contractStatus: newAccount.contract_status,
      status: newAccount.status,
      balance: newAccount.balance,
      addressFull: newAccount.address_full,
      userId: newAccount.user_id,
      createdAt: newAccount.date_created
    }
  }
})
