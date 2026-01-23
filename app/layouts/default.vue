<script setup lang="ts">
import { useAdminAuthStore } from '~/stores/adminAuth'

const adminAuthStore = useAdminAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await adminAuthStore.logout()
  router.push('/admin/login')
}
</script>

<template>
  <div class="min-h-screen flex" style="background-color: var(--bg-base);">
    <!-- Sidebar -->
    <aside class="hidden md:flex w-64 flex-col glass-card border-r border-[var(--glass-border)]">
      <div class="p-6">
        <!-- Header with logo and logout -->
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-xl font-bold text-[var(--text-primary)]">
            Админ-панель
          </h2>
          <button
            @click="handleLogout"
            class="p-2 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Выйти"
          >
            <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5" />
          </button>
        </div>

        <!-- Navigation -->
        <nav class="space-y-2">
          <NuxtLink
            to="/dashboard"
            class="nav-item"
            active-class="nav-item-active"
          >
            <Icon name="heroicons:home" class="w-5 h-5" />
            <span>Dashboard</span>
          </NuxtLink>

          <!-- Пользователи (все роли) -->
          <NuxtLink
            v-if="adminAuthStore.canViewUsers"
            to="/users"
            class="nav-item"
            active-class="nav-item-active"
          >
            <Icon name="heroicons:users" class="w-5 h-5" />
            <span>Пользователи</span>
          </NuxtLink>

          <!-- Аккаунты (все роли) -->
          <NuxtLink
            v-if="adminAuthStore.canViewAccounts"
            to="/accounts"
            class="nav-item"
            active-class="nav-item-active"
          >
            <Icon name="heroicons:identification" class="w-5 h-5" />
            <span>Аккаунты</span>
          </NuxtLink>

          <!-- Новости (все роли) -->
          <NuxtLink
            v-if="adminAuthStore.canManageNews"
            to="/news"
            class="nav-item"
            active-class="nav-item-active"
          >
            <Icon name="heroicons:newspaper" class="w-5 h-5" />
            <span>Новости</span>
          </NuxtLink>

          <!-- Каталог (admin, moderator) -->
          <NuxtLink
            v-if="adminAuthStore.canManageCatalog"
            to="/catalog"
            class="nav-item"
            active-class="nav-item-active"
          >
            <Icon name="heroicons:squares-2x2" class="w-5 h-5" />
            <span>Каталог</span>
          </NuxtLink>

          <!-- Карта покрытия (admin, moderator) -->
          <NuxtLink
            v-if="adminAuthStore.canManageCoverage"
            to="/coverage"
            class="nav-item"
            active-class="nav-item-active"
          >
            <Icon name="heroicons:map" class="w-5 h-5" />
            <span>Карта покрытия</span>
          </NuxtLink>

          <!-- Заявки на подключение (все роли) -->
          <NuxtLink
            v-if="adminAuthStore.canManageRequests"
            to="/requests"
            class="nav-item"
            active-class="nav-item-active"
          >
            <Icon name="heroicons:clipboard-document-list" class="w-5 h-5" />
            <span>Заявки</span>
          </NuxtLink>

          <!-- Чат (admin, support) -->
          <NuxtLink
            v-if="adminAuthStore.canAccessChat"
            to="/chat"
            class="nav-item"
            active-class="nav-item-active"
          >
            <Icon name="heroicons:chat-bubble-left-right" class="w-5 h-5" />
            <span>Чат</span>
          </NuxtLink>

          <!-- Тикеты (admin, support) -->
          <NuxtLink
            v-if="adminAuthStore.canAccessTickets"
            to="/tickets"
            class="nav-item"
            active-class="nav-item-active"
          >
            <Icon name="heroicons:ticket" class="w-5 h-5" />
            <span>Тикеты</span>
          </NuxtLink>

          <!-- AI-бот (только admin) -->
          <NuxtLink
            v-if="adminAuthStore.canManageAI"
            to="/settings/ai"
            class="nav-item"
            active-class="nav-item-active"
          >
            <Icon name="heroicons:sparkles" class="w-5 h-5" />
            <span>AI-бот</span>
          </NuxtLink>
        </nav>

      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto">
      <div class="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <slot />
      </div>
    </main>

    <!-- Mobile nav -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-[var(--glass-border)] p-4 pb-safe">
      <div class="flex items-center justify-around">
        <NuxtLink to="/dashboard" class="mobile-nav-item">
          <Icon name="heroicons:home" class="w-5 h-5" />
          <span class="text-xs">Dashboard</span>
        </NuxtLink>

        <NuxtLink v-if="adminAuthStore.canManageNews" to="/news" class="mobile-nav-item">
          <Icon name="heroicons:newspaper" class="w-5 h-5" />
          <span class="text-xs">Новости</span>
        </NuxtLink>

        <NuxtLink v-if="adminAuthStore.canAccessTickets" to="/tickets" class="mobile-nav-item">
          <Icon name="heroicons:ticket" class="w-5 h-5" />
          <span class="text-xs">Тикеты</span>
        </NuxtLink>

        <button @click="handleLogout" class="mobile-nav-item text-red-400">
          <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5" />
          <span class="text-xs">Выйти</span>
        </button>
      </div>
    </div>

    <!-- Toast notifications -->
    <UiToastContainer />
  </div>
</template>

<style scoped>
.nav-item {
  @apply flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)] transition-colors cursor-pointer;
}

.nav-item-active {
  @apply bg-gradient-to-r from-primary/20 to-secondary/10 text-[var(--text-primary)] font-semibold;
}

.mobile-nav-item {
  @apply flex flex-col items-center gap-1 text-[var(--text-secondary)];
}

.mobile-nav-item.router-link-active {
  @apply text-primary;
}
</style>
