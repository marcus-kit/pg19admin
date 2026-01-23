import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

interface AdminLoginRequest {
  email: string
  password: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<AdminLoginRequest>(event)

  // Валидация входных данных
  if (!body.email || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email и пароль обязательны'
    })
  }

  // Проверка формата email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(body.email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Некорректный формат email'
    })
  }

  // Аутентификация через Supabase Auth
  // Cookie устанавливается автоматически модулем @nuxtjs/supabase
  const supabase = await serverSupabaseClient(event)
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password
  })

  if (authError || !authData.user) {
    console.warn(`[Auth] Failed admin login for: ${body.email}`)
    throw createError({
      statusCode: 401,
      statusMessage: 'Неверные учётные данные'
    })
  }

  // Проверяем что пользователь есть в таблице admins и активен
  const supabaseAdmin = serverSupabaseServiceRole(event)
  const { data: admin, error: adminError } = await supabaseAdmin
    .from('admins')
    .select('*')
    .eq('auth_user_id', authData.user.id)
    .eq('status', 'active')
    .single()

  if (adminError || !admin) {
    console.warn(`[Auth] Admin access denied for: ${body.email}`)
    // Выходим из Supabase Auth если пользователь не админ
    await supabase.auth.signOut()
    throw createError({
      statusCode: 401,
      statusMessage: 'Неверные учётные данные'
    })
  }

  // Обновляем last_login_at
  await supabaseAdmin
    .from('admins')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', admin.id)

  // Возвращаем данные админа
  return {
    success: true,
    admin: {
      id: admin.id,
      email: admin.email,
      fullName: admin.full_name,
      role: admin.role,
      permissions: admin.permissions || {},
      lastLogin: admin.last_login_at
    }
  }
})
