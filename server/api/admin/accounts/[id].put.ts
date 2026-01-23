import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID аккаунта не указан'
    })
  }

  const body = await readBody(event)
  const supabase = useSupabaseAdmin(event)

  // Проверяем существование аккаунта
  const { data: existingAccount, error: fetchError } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', id)
    .single()

  if (fetchError || !existingAccount) {
    throw createError({
      statusCode: 404,
      message: 'Аккаунт не найден'
    })
  }

  // Собираем поля для обновления
  const updateData: Record<string, any> = {
    date_updated: new Date().toISOString()
  }

  // Данные договора
  if (body.contractNumber !== undefined) updateData.contract_number = body.contractNumber
  if (body.contractStatus !== undefined) {
    if (!['draft', 'active', 'terminated', 'stopped'].includes(body.contractStatus)) {
      throw createError({
        statusCode: 400,
        message: 'Некорректный статус договора'
      })
    }
    updateData.contract_status = body.contractStatus
  }
  if (body.startDate !== undefined) updateData.start_date = body.startDate
  if (body.endDate !== undefined) updateData.end_date = body.endDate
  if (body.notes !== undefined) updateData.notes = body.notes

  // Адрес (address_full генерируется автоматически триггером в Supabase)
  if (body.address) {
    if (body.address.city !== undefined) updateData.address_city = body.address.city
    if (body.address.district !== undefined) updateData.address_district = body.address.district
    if (body.address.street !== undefined) updateData.address_street = body.address.street
    if (body.address.building !== undefined) updateData.address_building = body.address.building
    if (body.address.apartment !== undefined) updateData.address_apartment = body.address.apartment
    if (body.address.entrance !== undefined) updateData.address_entrance = body.address.entrance
    if (body.address.floor !== undefined) updateData.address_floor = body.address.floor
    if (body.address.intercom !== undefined) updateData.address_intercom = body.address.intercom
  }

  const { data: updatedAccount, error: updateError } = await supabase
    .from('accounts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    console.error('Failed to update account:', updateError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении аккаунта'
    })
  }

  return {
    success: true,
    account: {
      id: updatedAccount.id,
      contractNumber: updatedAccount.contract_number,
      contractStatus: updatedAccount.contract_status,
      status: updatedAccount.status,
      balance: updatedAccount.balance,
      addressFull: updatedAccount.address_full,
      updatedAt: updatedAccount.date_updated
    }
  }
})
