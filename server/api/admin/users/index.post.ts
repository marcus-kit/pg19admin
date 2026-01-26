import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const supabase = useSupabaseAdmin(event)

  // Валидация обязательных полей
  if (!body.firstName?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Имя обязательно',
    })
  }

  if (!body.lastName?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Фамилия обязательна',
    })
  }

  // Собираем данные для вставки
  const insertData: {
    first_name: string
    last_name: string
    middle_name?: string
    phone?: string
    email?: string
    birth_date?: string
    telegram_username?: string
    vk_id?: string
    passport_series?: string
    passport_number?: string
    reg_city?: string
    reg_street?: string
    reg_building?: string
    reg_apartment?: string
    full_name?: string
  } = {
    first_name: body.firstName.trim(),
    last_name: body.lastName.trim(),
  }

  // Опциональные поля
  if (body.middleName?.trim()) insertData.middle_name = body.middleName.trim()
  if (body.phone?.trim()) insertData.phone = body.phone.trim()
  if (body.email?.trim()) insertData.email = body.email.trim()
  if (body.birthDate) insertData.birth_date = body.birthDate
  if (body.telegramUsername?.trim()) insertData.telegram_username = body.telegramUsername.trim()
  if (body.vkId?.trim()) insertData.vk_id = body.vkId.trim()
  if (body.passportSeries?.trim()) insertData.passport_series = body.passportSeries.trim()
  if (body.passportNumber?.trim()) insertData.passport_number = body.passportNumber.trim()
  if (body.regCity?.trim()) insertData.reg_city = body.regCity.trim()
  if (body.regStreet?.trim()) insertData.reg_street = body.regStreet.trim()
  if (body.regBuilding?.trim()) insertData.reg_building = body.regBuilding.trim()
  if (body.regApartment?.trim()) insertData.reg_apartment = body.regApartment.trim()

  // Генерируем full_name
  insertData.full_name = [
    body.lastName?.trim(),
    body.firstName?.trim(),
    body.middleName?.trim(),
  ].filter(Boolean).join(' ')

  const { data: newUser, error } = await supabase
    .from('users')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Failed to create user:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при создании пользователя',
    })
  }

  return {
    success: true,
    user: {
      id: newUser.id,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      middleName: newUser.middle_name,
      fullName: newUser.full_name,
      phone: newUser.phone,
      email: newUser.email,
      status: newUser.status,
      createdAt: newUser.created_at,
    },
  }
})
