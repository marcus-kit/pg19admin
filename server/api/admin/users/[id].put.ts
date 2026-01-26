import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID пользователя не указан',
    })
  }

  const body = await readBody(event)
  const supabase = useSupabaseAdmin(event)

  // Проверяем существование пользователя
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .single()

  if (fetchError || !existingUser) {
    throw createError({
      statusCode: 404,
      message: 'Пользователь не найден',
    })
  }

  // Собираем поля для обновления
  const updateData: {
    date_updated: string
    first_name?: string
    last_name?: string
    middle_name?: string
    email?: string
    phone?: string
    birth_date?: string
    nickname?: string
    avatar?: string
    telegram_username?: string
    vk_id?: string
    full_name?: string
    passport_series?: string
    passport_number?: string
    reg_city?: string
    reg_street?: string
    reg_building?: string
    reg_apartment?: string
  } = {
    date_updated: new Date().toISOString(),
  }

  // Основные данные
  if (body.firstName !== undefined) updateData.first_name = body.firstName
  if (body.lastName !== undefined) updateData.last_name = body.lastName
  if (body.middleName !== undefined) updateData.middle_name = body.middleName
  if (body.email !== undefined) updateData.email = body.email
  if (body.phone !== undefined) updateData.phone = body.phone
  if (body.birthDate !== undefined) updateData.birth_date = body.birthDate
  if (body.nickname !== undefined) updateData.nickname = body.nickname
  if (body.avatar !== undefined) updateData.avatar = body.avatar
  if (body.telegramUsername !== undefined) updateData.telegram_username = body.telegramUsername
  if (body.vkId !== undefined) updateData.vk_id = body.vkId

  // Обновляем full_name если изменились имя/фамилия
  if (body.firstName !== undefined || body.lastName !== undefined || body.middleName !== undefined) {
    const firstName = body.firstName ?? existingUser.first_name ?? ''
    const lastName = body.lastName ?? existingUser.last_name ?? ''
    const middleName = body.middleName ?? existingUser.middle_name ?? ''
    updateData.full_name = `${lastName} ${firstName} ${middleName}`.trim()
  }

  // Паспортные данные
  if (body.passportSeries !== undefined) updateData.passport_series = body.passportSeries
  if (body.passportNumber !== undefined) updateData.passport_number = body.passportNumber

  // Адрес регистрации
  if (body.regCity !== undefined) updateData.reg_city = body.regCity
  if (body.regStreet !== undefined) updateData.reg_street = body.regStreet
  if (body.regBuilding !== undefined) updateData.reg_building = body.regBuilding
  if (body.regApartment !== undefined) updateData.reg_apartment = body.regApartment

  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    console.error('Failed to update user:', updateError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении пользователя',
    })
  }

  return {
    success: true,
    user: {
      id: updatedUser.id,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      middleName: updatedUser.middle_name,
      fullName: updatedUser.full_name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      birthDate: updatedUser.birth_date,
      nickname: updatedUser.nickname,
      avatar: updatedUser.avatar,
      status: updatedUser.status,
      updatedAt: updatedUser.date_updated,
    },
  }
})
