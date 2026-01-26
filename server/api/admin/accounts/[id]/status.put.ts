import { requireParam, requireEntity, throwSupabaseError } from '~~/server/utils/api-helpers'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const id = requireParam(event, 'id', 'аккаунта')
  const body = await readBody(event)
  const { status } = body

  if (!status || !['active', 'blocked', 'closed'].includes(status)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный статус. Допустимые значения: active, blocked, closed',
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Проверяем существование аккаунта
  const existingAccount = await requireEntity<{ id: string, status: string }>(
    supabase,
    'accounts',
    id,
    'Аккаунт',
    'id, status',
  )

  // Обновляем статус
  const updateData: {
    status: string
    date_updated: string
    blocked_at?: string | null
  } = {
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

  if (updateError) throwSupabaseError(updateError, 'обновлении статуса')

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
