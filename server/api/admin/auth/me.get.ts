import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Получаем user из Supabase Auth (JWT из cookie)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Не авторизован',
    })
  }

  // JWT payload использует 'sub' для user ID, а не 'id'
  const userId = user.id || user.sub

  // Проверяем что user есть в таблице admins и активен
  const supabase = serverSupabaseServiceRole(event)
  const { data: admin, error } = await supabase
    .from('admins')
    .select('*')
    .eq('auth_user_id', userId)
    .eq('status', 'active')
    .single()

  if (error || !admin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Доступ запрещен',
    })
  }

  return {
    admin: {
      id: admin.id,
      email: admin.email,
      fullName: admin.full_name,
      role: admin.role,
      permissions: admin.permissions || {},
      lastLogin: admin.last_login_at,
    },
  }
})
