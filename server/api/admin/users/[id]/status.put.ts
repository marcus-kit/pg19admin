import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID пользователя не указан'
    })
  }

  const body = await readBody(event)
  const { status, reason } = body

  if (!status || !['active', 'suspended', 'terminated'].includes(status)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный статус. Допустимые значения: active, suspended, terminated'
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Проверяем существование пользователя
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchError || !existingUser) {
    throw createError({
      statusCode: 404,
      message: 'Пользователь не найден'
    })
  }

  // Обновляем статус
  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({
      status,
      date_updated: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, status, date_updated')
    .single()

  if (updateError) {
    console.error('Failed to update user status:', updateError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении статуса'
    })
  }

  return {
    success: true,
    user: {
      id: updatedUser.id,
      status: updatedUser.status,
      updatedAt: updatedUser.date_updated
    }
  }
})
