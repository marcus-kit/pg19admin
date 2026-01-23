import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'

// Типы
export type AdminRole = 'admin' | 'moderator' | 'support'

export type Permission =
  // Новости
  | 'news:read' | 'news:create' | 'news:update' | 'news:delete'
  // Страницы
  | 'pages:read' | 'pages:create' | 'pages:update' | 'pages:delete'
  // Каталог
  | 'catalog:read' | 'catalog:create' | 'catalog:update' | 'catalog:delete'
  // Карта покрытия
  | 'coverage:read' | 'coverage:create' | 'coverage:update' | 'coverage:delete'
  // Заявки на подключение
  | 'requests:read' | 'requests:update'
  // Чат
  | 'chat:read' | 'chat:respond'
  // Тикеты
  | 'tickets:read' | 'tickets:respond' | 'tickets:close'
  // AI-бот
  | 'ai:read' | 'ai:manage'
  // Пользователи
  | 'users:read' | 'users:create' | 'users:update' | 'users:manage'
  // Аккаунты
  | 'accounts:read' | 'accounts:create' | 'accounts:update' | 'accounts:manage'
  // Управление
  | 'admins:manage'

export interface Admin {
  id: string
  authUserId: string // UUID из auth.users для FK ссылок
  email: string
  fullName: string
  role: AdminRole
  permissions: Record<string, boolean>
  lastLogin: string | null
}

// Права по ролям
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  admin: [
    'news:read', 'news:create', 'news:update', 'news:delete',
    'pages:read', 'pages:create', 'pages:update', 'pages:delete',
    'catalog:read', 'catalog:create', 'catalog:update', 'catalog:delete',
    'coverage:read', 'coverage:create', 'coverage:update', 'coverage:delete',
    'requests:read', 'requests:update',
    'chat:read', 'chat:respond',
    'tickets:read', 'tickets:respond', 'tickets:close',
    'ai:read', 'ai:manage',
    'users:read', 'users:create', 'users:update', 'users:manage',
    'accounts:read', 'accounts:create', 'accounts:update', 'accounts:manage',
    'admins:manage'
  ],
  moderator: [
    'news:read', 'news:create', 'news:update', 'news:delete',
    'pages:read', 'pages:create', 'pages:update', 'pages:delete',
    'catalog:read', 'catalog:create', 'catalog:update', 'catalog:delete',
    'coverage:read', 'coverage:create', 'coverage:update', 'coverage:delete',
    'requests:read', 'requests:update',
    'users:read', 'users:update',
    'accounts:read', 'accounts:update'
  ],
  support: [
    'news:read', 'news:create', 'news:update',
    'requests:read', 'requests:update',
    'chat:read', 'chat:respond',
    'tickets:read', 'tickets:respond', 'tickets:close',
    'users:read',
    'accounts:read'
  ]
}

/**
 * Проверяет, имеет ли админ указанное право
 */
export function hasPermission(admin: Admin, permission: Permission): boolean {
  // Сначала проверяем кастомные permissions из БД
  if (admin.permissions[permission] === true) {
    return true
  }
  if (admin.permissions[permission] === false) {
    return false
  }

  // Иначе проверяем по роли
  const rolePermissions = ROLE_PERMISSIONS[admin.role] || []
  return rolePermissions.includes(permission)
}

/**
 * Получает админа из Supabase Auth сессии
 * Возвращает null если не авторизован или не админ
 */
export async function getAdminFromRequest(event: H3Event): Promise<Admin | null> {
  // Получаем user из Supabase Auth (JWT из cookie)
  const user = await serverSupabaseUser(event)
  if (!user) {
    return null
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
    return null
  }

  return {
    id: admin.id,
    authUserId: admin.auth_user_id,
    email: admin.email,
    fullName: admin.full_name,
    role: admin.role as AdminRole,
    permissions: admin.permissions || {},
    lastLogin: admin.last_login_at
  }
}

/**
 * Требует авторизации админа
 * Выбрасывает 401 если не авторизован
 */
export async function requireAdmin(event: H3Event): Promise<Admin> {
  const admin = await getAdminFromRequest(event)

  if (!admin) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Не авторизован'
    })
  }

  return admin
}

/**
 * Требует наличия определенного права
 * Выбрасывает 401 если не авторизован, 403 если нет права
 */
export async function requirePermission(event: H3Event, permission: Permission): Promise<Admin> {
  const admin = await requireAdmin(event)

  if (!hasPermission(admin, permission)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Недостаточно прав'
    })
  }

  return admin
}
