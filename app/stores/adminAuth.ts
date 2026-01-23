import { defineStore } from 'pinia'

const STORAGE_KEY = 'pg19_admin_auth'

type AdminRole = 'admin' | 'moderator' | 'support'

interface Admin {
  id: string
  email: string
  fullName: string
  role: AdminRole
  permissions: Record<string, boolean>
  lastLogin: string | null
}

interface AdminAuthState {
  isAuthenticated: boolean
  admin: Admin | null
  isLoading: boolean
}

export const useAdminAuthStore = defineStore('adminAuth', {
  state: (): AdminAuthState => ({
    isAuthenticated: false,
    admin: null,
    isLoading: false
  }),

  getters: {
    // Проверка ролей
    isAdmin: (state): boolean => state.admin?.role === 'admin',
    isModerator: (state): boolean => state.admin?.role === 'moderator',
    isSupport: (state): boolean => state.admin?.role === 'support',

    // Права на управление контентом
    canManageNews: (state): boolean => {
      const role = state.admin?.role
      return role === 'admin' || role === 'moderator' || role === 'support'
    },

    canDeleteNews: (state): boolean => {
      const role = state.admin?.role
      return role === 'admin' || role === 'moderator'
    },

    canManagePages: (state): boolean => {
      const role = state.admin?.role
      return role === 'admin' || role === 'moderator'
    },

    canManageCatalog: (state): boolean => {
      const role = state.admin?.role
      return role === 'admin' || role === 'moderator'
    },

    canManageCoverage: (state): boolean => {
      const role = state.admin?.role
      return role === 'admin' || role === 'moderator'
    },

    // Права на чат и тикеты
    canAccessChat: (state): boolean => {
      const role = state.admin?.role
      return role === 'admin' || role === 'support'
    },

    canAccessTickets: (state): boolean => {
      const role = state.admin?.role
      return role === 'admin' || role === 'support'
    },

    // Заявки на подключение (все роли)
    canManageRequests: (state): boolean => {
      const role = state.admin?.role
      return role === 'admin' || role === 'moderator' || role === 'support'
    },

    // Права на управление
    canManageAdmins: (state): boolean => {
      return state.admin?.role === 'admin'
    },

    // Права на AI-бота (только admin)
    canManageAI: (state): boolean => {
      return state.admin?.role === 'admin'
    },

    // Права на управление пользователями
    canViewUsers: (state): boolean => {
      const role = state.admin?.role
      return role === 'admin' || role === 'moderator' || role === 'support'
    },

    canCreateUsers: (state): boolean => {
      return state.admin?.role === 'admin'
    },

    canEditUsers: (state): boolean => {
      const role = state.admin?.role
      return role === 'admin' || role === 'moderator'
    },

    canManageUsers: (state): boolean => {
      return state.admin?.role === 'admin'
    },

    // Права на управление аккаунтами
    canViewAccounts: (state): boolean => {
      const role = state.admin?.role
      return role === 'admin' || role === 'moderator' || role === 'support'
    },

    canCreateAccounts: (state): boolean => {
      return state.admin?.role === 'admin'
    },

    canEditAccounts: (state): boolean => {
      const role = state.admin?.role
      return role === 'admin' || role === 'moderator'
    },

    canManageAccounts: (state): boolean => {
      return state.admin?.role === 'admin'
    },

    // Проверка конкретного разрешения из БД
    hasPermission: (state) => (permission: string): boolean => {
      return state.admin?.permissions?.[permission] === true
    }
  },

  actions: {
    /**
     * Вход в систему
     * Cookie устанавливается автоматически Supabase Auth
     */
    async login(email: string, password: string): Promise<boolean> {
      const toast = useToast()
      this.isLoading = true
      try {
        const response = await $fetch<{ success: boolean; admin: Admin }>(
          '/api/admin/auth/login',
          {
            method: 'POST',
            body: { email, password }
          }
        )

        if (response.success && response.admin) {
          this.isAuthenticated = true
          this.admin = response.admin
          return true
        }
        return false
      } catch (error: any) {
        console.error('Admin login failed:', error)
        toast.error('Ошибка входа в систему')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Выход из системы
     * Cookie удаляется автоматически Supabase Auth
     */
    async logout(): Promise<void> {
      const toast = useToast()
      try {
        await $fetch('/api/admin/auth/logout', { method: 'POST' })
      } catch (error) {
        console.error('Logout error:', error)
        toast.error('Ошибка при выходе из системы')
      } finally {
        this.isAuthenticated = false
        this.admin = null
      }
    },

    /**
     * Проверка текущей сессии через API
     */
    async checkAuth(): Promise<boolean> {
      this.isLoading = true
      try {
        const response = await $fetch<{ admin: Admin }>('/api/admin/auth/me')

        if (response.admin) {
          this.isAuthenticated = true
          this.admin = response.admin
          return true
        }
        return false
      } catch {
        this.isAuthenticated = false
        this.admin = null
        return false
      } finally {
        this.isLoading = false
      }
    }
  },

  persist: {
    key: STORAGE_KEY,
    pick: ['isAuthenticated', 'admin']
  }
})
