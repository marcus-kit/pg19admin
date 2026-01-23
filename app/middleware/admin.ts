import { useAdminAuthStore } from '~/stores/adminAuth'

export default defineNuxtRouteMiddleware(async (to) => {
  // Пропускаем на сервере
  if (import.meta.server) {
    return
  }

  const adminAuthStore = useAdminAuthStore()
  const user = useSupabaseUser()

  // Пропускаем страницу логина
  if (to.path === '/admin/login') {
    // Если есть Supabase сессия и данные админа — редирект на dashboard
    if (user.value && adminAuthStore.isAuthenticated) {
      return navigateTo('/dashboard')
    }
    return
  }

  // Если нет Supabase user — сразу редирект на логин
  if (!user.value) {
    return navigateTo('/admin/login')
  }

  // Проверяем данные админа через API
  const isAuthenticated = await adminAuthStore.checkAuth()

  if (!isAuthenticated) {
    return navigateTo('/admin/login')
  }
})
