import { requireParam, requireEntity, throwSupabaseError } from '~~/server/utils/api-helpers'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const id = requireParam(event, 'id', 'пользователя')
  const body = await readBody(event)
  const { status } = body

  if (!status || !['active', 'suspended', 'terminated'].includes(status)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный статус. Допустимые значения: active, suspended, terminated',
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Проверяем существование пользователя
  await requireEntity(supabase, 'users', id, 'Пользователь')

  // Обновляем статус
  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({
      status,
      date_updated: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, status, date_updated')
    .single()

  if (updateError) throwSupabaseError(updateError, 'обновлении статуса')

  return {
    success: true,
    user: {
      id: updatedUser.id,
      status: updatedUser.status,
      updatedAt: updatedUser.date_updated,
    },
  }
})
