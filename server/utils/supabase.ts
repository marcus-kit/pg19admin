import type { H3Event } from 'h3'

import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

/**
 * Данные текущего администратора
 */
export interface CurrentAdmin {
  id: string
  authUserId: string
  email: string
  fullName: string
  role: string
  permissions: Record<string, boolean>
}

// Тип записи из таблицы admins
interface AdminRecord {
  id: string
  auth_user_id: string
  email: string
  full_name: string
  role: string
  permissions: Record<string, boolean> | null
}

/**
 * Возвращает Supabase клиент для серверных операций администратора.
 * Использует service_role ключ для полного доступа к БД.
 *
 * @example
 * ```ts
 * const supabase = useSupabaseAdmin(event)
 * const { data } = await supabase.from('users').select()
 * ```
 */
export function useSupabaseAdmin(event: H3Event) {
  return serverSupabaseServiceRole(event)
}

/**
 * Получает текущего администратора из JWT.
 * Проверяет что пользователь авторизован и является активным админом.
 *
 * @throws 401 если не авторизован
 * @throws 403 если не админ или неактивен
 *
 * @example
 * ```ts
 * export default defineEventHandler(async (event) => {
 *   const admin = await getAdminFromEvent(event)
 *   console.log(admin.fullName) // 'Иван Иванов'
 * })
 * ```
 */
export async function getAdminFromEvent(event: H3Event): Promise<CurrentAdmin> {
  // Получаем user из Supabase Auth (JWT из cookie)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Не авторизован',
    })
  }

  // JWT payload использует 'sub' для user ID
  const userId = user.id || (user as { sub?: string }).sub

  // Проверяем что user есть в таблице admins и активен
  const supabase = serverSupabaseServiceRole(event)
  const { data: admin, error } = await supabase
    .from('admins')
    .select('id, auth_user_id, email, full_name, role, permissions')
    .eq('auth_user_id', userId)
    .eq('status', 'active')
    .single<AdminRecord>()

  if (error || !admin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Доступ запрещен',
    })
  }

  return {
    id: admin.id,
    authUserId: admin.auth_user_id,
    email: admin.email,
    fullName: admin.full_name,
    role: admin.role,
    permissions: admin.permissions || {},
  }
}
