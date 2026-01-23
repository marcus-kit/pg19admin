import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'

export interface Admin {
  id: string
  authUserId: string
  email: string
  fullName: string
}

/**
 * Проверяет что пользователь — админ
 * Возвращает данные админа или выбрасывает 401
 */
export async function requireAdmin(event: H3Event): Promise<Admin> {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Не авторизован'
    })
  }

  const userId = user.id

  const supabase = serverSupabaseServiceRole(event)
  const { data: admin, error } = await supabase
    .from('admins')
    .select('id, auth_user_id, email, full_name')
    .eq('auth_user_id', userId)
    .eq('status', 'active')
    .single()

  if (error || !admin) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Не авторизован'
    })
  }

  return {
    id: admin.id,
    authUserId: admin.auth_user_id,
    email: admin.email,
    fullName: admin.full_name
  }
}
