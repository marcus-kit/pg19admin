<script setup lang="ts">
/**
 * Default layout — основной layout админ-панели
 *
 * Содержит боковую навигацию (desktop), мобильную навигацию (bottom bar),
 * и контейнер для toast-уведомлений.
 */

const supabase = useSupabaseClient()

async function handleLogout() {
  await supabase.auth.signOut()
  // Полный reload для сброса состояния сессии (Gotcha #4)
  window.location.href = '/admin/login'
}
</script>

<template>
  <div class="layout-root min-h-screen flex">
    <!-- Боковая панель -->
    <aside class="hidden md:flex w-64 flex-col glass-card border-r border-[var(--glass-border)]">
      <div class="p-6">
        <!-- Шапка с кнопкой выхода -->
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-xl font-bold text-[var(--text-primary)]">
            Админ-панель
          </h2>
          <button
            @click="handleLogout"
            title="Выйти"
            class="p-2 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5" />
          </button>
        </div>

        <!-- Навигация -->
        <nav class="space-y-2">
          <NuxtLink to="/dashboard" active-class="nav-item-active" class="nav-item">
            <Icon name="heroicons:home" class="w-5 h-5" />
            <span>Dashboard</span>
          </NuxtLink>

          <NuxtLink to="/users" active-class="nav-item-active" class="nav-item">
            <Icon name="heroicons:users" class="w-5 h-5" />
            <span>Пользователи</span>
          </NuxtLink>

          <NuxtLink to="/accounts" active-class="nav-item-active" class="nav-item">
            <Icon name="heroicons:document-text" class="w-5 h-5" />
            <span>Договоры</span>
          </NuxtLink>

          <NuxtLink to="/news" active-class="nav-item-active" class="nav-item">
            <Icon name="heroicons:newspaper" class="w-5 h-5" />
            <span>Новости</span>
          </NuxtLink>

          <NuxtLink to="/catalog" active-class="nav-item-active" class="nav-item">
            <Icon name="heroicons:squares-2x2" class="w-5 h-5" />
            <span>Каталог</span>
          </NuxtLink>

          <NuxtLink to="/coverage" active-class="nav-item-active" class="nav-item">
            <Icon name="heroicons:map" class="w-5 h-5" />
            <span>Карта покрытия</span>
          </NuxtLink>

          <NuxtLink to="/requests" active-class="nav-item-active" class="nav-item">
            <Icon name="heroicons:clipboard-document-list" class="w-5 h-5" />
            <span>Заявки</span>
          </NuxtLink>

          <NuxtLink to="/chat" active-class="nav-item-active" class="nav-item">
            <Icon name="heroicons:chat-bubble-left-right" class="w-5 h-5" />
            <span>Чат</span>
          </NuxtLink>

          <NuxtLink to="/tickets" active-class="nav-item-active" class="nav-item">
            <Icon name="heroicons:ticket" class="w-5 h-5" />
            <span>Тикеты</span>
          </NuxtLink>

          <NuxtLink to="/settings/ai" active-class="nav-item-active" class="nav-item">
            <Icon name="heroicons:sparkles" class="w-5 h-5" />
            <span>AI-бот</span>
          </NuxtLink>
        </nav>
      </div>
    </aside>

    <!-- Основной контент -->
    <main class="flex-1 overflow-y-auto">
      <div class="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <slot />
      </div>
    </main>

    <!-- Мобильная навигация -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-[var(--glass-border)] p-4 pb-safe">
      <div class="flex items-center justify-around">
        <NuxtLink to="/dashboard" class="mobile-nav-item">
          <Icon name="heroicons:home" class="w-5 h-5" />
          <span class="text-xs">Dashboard</span>
        </NuxtLink>

        <NuxtLink to="/news" class="mobile-nav-item">
          <Icon name="heroicons:newspaper" class="w-5 h-5" />
          <span class="text-xs">Новости</span>
        </NuxtLink>

        <NuxtLink to="/tickets" class="mobile-nav-item">
          <Icon name="heroicons:ticket" class="w-5 h-5" />
          <span class="text-xs">Тикеты</span>
        </NuxtLink>

        <button @click="handleLogout" class="mobile-nav-item text-red-400">
          <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5" />
          <span class="text-xs">Выйти</span>
        </button>
      </div>
    </div>

    <!-- Уведомления -->
    <UiToastContainer />
  </div>
</template>

<style scoped>
.layout-root {
  background-color: var(--bg-base);
}

.nav-item {
  @apply flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer;
  color: var(--text-secondary);
}

.nav-item:hover {
  background-color: var(--glass-bg);
  color: var(--text-primary);
}

.nav-item-active {
  @apply bg-gradient-to-r from-primary/20 to-secondary/10 font-semibold;
  color: var(--text-primary);
}

.mobile-nav-item {
  @apply flex flex-col items-center gap-1;
  color: var(--text-secondary);
}

.mobile-nav-item.router-link-active {
  @apply text-primary;
}
</style>
