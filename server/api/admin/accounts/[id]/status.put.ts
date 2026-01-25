import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID аккаунта не указан',
    })
  }

  const body = await readBody(event)
  const { status, reason: _reason } = body

  if (!status || !['active', 'blocked', 'closed'].includes(status)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный статус. Допустимые значения: active, blocked, closed',
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Проверяем существование аккаунта
  const { data: existingAccount, error: fetchError } = await supabase
    .from('accounts')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchError || !existingAccount) {
    throw createError({
      statusCode: 404,
      message: 'Аккаунт не найден',
    })
  }

  // Обновляем статус
  const updateData: Record<string, any> = {
    status,
    date_updated: new Date().toISOString(),
  }

  // Устанавливаем blocked_at при блокировке
  if (status === 'blocked') {
    updateData.blocked_at = new Date().toISOString()
  }
  else if (status === 'active' && existingAccount.status === 'blocked') {
    // Сбрасываем blocked_at при разблокировке
    updateData.blocked_at = null
  }

  const { data: updatedAccount, error: updateError } = await supabase
    .from('accounts')
    .update(updateData)
    .eq('id', id)
    .select('id, status, blocked_at, date_updated')
    .single()

  if (updateError) {
    console.error('Failed to update account status:', updateError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении статуса',
    })
  }

  return {
    success: true,
    account: {
      id: updatedAccount.id,
      status: updatedAccount.status,
      blockedAt: updatedAccount.blocked_at,
      updatedAt: updatedAccount.date_updated,
    },
  }
})
