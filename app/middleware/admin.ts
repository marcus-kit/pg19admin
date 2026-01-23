/**
 * Middleware для защиты админ-страниц
 * Проверяет наличие Supabase сессии
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Пропускаем на сервере
  if (import.meta.server) {
    return
  }

  const user = useSupabaseUser()

  // Пропускаем страницу логина
  if (to.path === '/admin/login') {
    // Если есть сессия — редирект на dashboard
    if (user.value) {
      return navigateTo('/dashboard')
    }
    return
  }

  // Если нет сессии — редирект на логин
  if (!user.value) {
    return navigateTo('/admin/login')
  }
})
