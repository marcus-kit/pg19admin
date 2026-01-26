<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: 'admin',
})

useHead({ title: 'Вход в админ-панель — ПЖ19' })

const supabase = useSupabaseClient()

// Данные формы
const form = reactive({
  email: '',
  password: '',
})

// Ошибки валидации
const errors = reactive({
  email: '',
  password: '',
  general: '',
})

const isLoading = ref(false) // Идёт ли запрос

// Валидация формы перед отправкой
function validate(): boolean {
  errors.email = ''
  errors.password = ''
  errors.general = ''

  if (!form.email) {
    errors.email = 'Введите email'
    return false
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Некорректный email'
    return false
  }
  if (!form.password) {
    errors.password = 'Введите пароль'
    return false
  }
  if (form.password.length < 6) {
    errors.password = 'Пароль должен быть не менее 6 символов'
    return false
  }
  return true
}

// Обработка входа в систему
async function handleLogin() {
  if (!validate()) return

  isLoading.value = true
  errors.general = ''

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      errors.general = 'Неверный email или пароль'
      return
    }

    // ВАЖНО: Полная перезагрузка для подхвата сессии Supabase
    window.location.href = '/dashboard'
  }
  catch {
    errors.general = 'Ошибка входа. Попробуйте позже.'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen mesh-gradient-hero flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- Card -->
      <div class="glass-card p-8 rounded-2xl">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="heroicons:shield-check" class="w-8 h-8 text-primary" />
          </div>
          <h1 class="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Админ-панель
          </h1>
          <p class="text-[var(--text-muted)]">
            Вход для администраторов
          </p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Email
            </label>
            <input
              v-model="form.email"
              :disabled="isLoading"
              id="email"
              :class="errors.email ? 'border-red-500' : 'border-[var(--glass-border)]'"
              type="email"
              placeholder="admin@doka.team"
              class="w-full px-4 py-3 bg-[var(--glass-bg)] border rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-400">{{ errors.email }}</p>
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Пароль
            </label>
            <input
              v-model="form.password"
              :disabled="isLoading"
              id="password"
              :class="errors.password ? 'border-red-500' : 'border-[var(--glass-border)]'"
              type="password"
              placeholder="••••••••"
              class="w-full px-4 py-3 bg-[var(--glass-bg)] border rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            <p v-if="errors.password" class="mt-1 text-sm text-red-400">{{ errors.password }}</p>
          </div>

          <!-- General Error -->
          <div v-if="errors.general" class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div class="flex items-center gap-2">
              <Icon name="heroicons:exclamation-circle" class="w-5 h-5 text-red-400 flex-shrink-0" />
              <p class="text-sm text-red-400">{{ errors.general }}</p>
            </div>
          </div>

          <!-- Submit Button -->
          <UiButton
            :loading="isLoading"
            type="submit"
            size="lg"
            block
          >
            Войти
          </UiButton>
        </form>

        <!-- Footer Links -->
        <div class="mt-6 text-center">
          <a
            href="https://pg19.doka.team"
            class="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1"
          >
            <Icon name="heroicons:arrow-left" class="w-4 h-4" />
            <span>Вернуться на сайт</span>
          </a>
        </div>
      </div>

      <!-- Security Notice -->
      <div class="mt-6 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-1">
        <Icon name="heroicons:lock-closed" class="w-3 h-3" />
        <span>Защищенное соединение</span>
      </div>
    </div>
  </div>
</template>
