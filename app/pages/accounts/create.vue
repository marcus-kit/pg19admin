<script setup lang="ts">
import type { UserSearchResult } from '~/types/admin'

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Создать аккаунт — Админ-панель' })

const toast = useToast()
const router = useRouter()

// Данные формы
const form = ref({
  userId: null as string | null,
  contractNumber: null as number | null,
  contractStatus: 'draft',
  startDate: '',
  endDate: '',
  notes: '',
  address: {
    city: '',
    district: '',
    street: '',
    building: '',
    apartment: '',
    entrance: '',
    floor: '',
    intercom: '',
  },
})

// Состояние формы
const saving = ref(false) // Идёт ли сохранение
const error = ref('') // Текст ошибки

// Состояние поиска пользователя
const userSearch = ref('') // Текст поиска
const userSearchResults = ref<UserSearchResult[]>([]) // Результаты поиска
const userSearchLoading = ref(false) // Загрузка поиска
const userSearchDebounce = ref<ReturnType<typeof setTimeout> | null>(null) // Таймер debounce
const showUserDropdown = ref(false) // Открыт ли dropdown
const selectedUser = ref<UserSearchResult | null>(null) // Выбранный пользователь

// Опции статуса договора
const contractStatusOptions = [
  { value: 'draft', label: 'Черновик' },
  { value: 'active', label: 'Активный' },
  { value: 'terminated', label: 'Расторгнут' },
  { value: 'stopped', label: 'Приостановлен' },
]

// Поиск пользователей по запросу
async function searchUsers(query: string) {
  if (!query.trim() || query.length < 2) {
    userSearchResults.value = []
    return
  }

  userSearchLoading.value = true
  try {
    const data = await $fetch<{ users: UserSearchResult[] }>(`/api/admin/users?search=${encodeURIComponent(query)}&limit=10`)
    userSearchResults.value = data.users
  }
  catch {
    toast.error('Не удалось найти пользователей')
    userSearchResults.value = []
  }
  finally {
    userSearchLoading.value = false
  }
}

// Обработка ввода в поле поиска с debounce
function onUserSearchInput() {
  if (userSearchDebounce.value) {
    clearTimeout(userSearchDebounce.value)
  }
  showUserDropdown.value = true
  userSearchDebounce.value = setTimeout(() => {
    searchUsers(userSearch.value)
  }, 300)
}

// Выбор пользователя из списка
function selectUser(user: UserSearchResult) {
  selectedUser.value = user
  form.value.userId = user.id
  userSearch.value = user.fullName
  showUserDropdown.value = false
  userSearchResults.value = []
}

// Очистка выбранного пользователя
function clearUser() {
  selectedUser.value = null
  form.value.userId = null
  userSearch.value = ''
}

// Создание нового аккаунта
async function createAccount() {
  if (saving.value) return

  error.value = ''

  saving.value = true
  try {
    const response = await $fetch<{ success: boolean, account: { id: string } }>('/api/admin/accounts', {
      method: 'POST',
      body: form.value,
    })

    if (response.success && response.account?.id) {
      toast.success('Аккаунт создан')
      router.push(`/accounts/${response.account.id}`)
    }
  }
  catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Ошибка при создании аккаунта'
    error.value = message
    toast.error('Не удалось создать аккаунт')
  }
  finally {
    saving.value = false
  }
}

// Отмена и возврат к списку
function cancel() {
  router.push('/accounts')
}

// Закрытие dropdown при клике вне его
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.user-search-container')) {
    showUserDropdown.value = false
  }
}

// Esc — отмена и возврат к списку
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (showUserDropdown.value) {
      showUserDropdown.value = false
    }
    else {
      cancel()
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <UiButton @click="cancel" variant="ghost" size="sm" title="К списку (Esc)" class="-ml-1 mb-3">
        <Icon name="heroicons:arrow-left" class="w-5 h-5 mr-1" />
        <span class="text-sm text-[var(--text-secondary)]">К списку</span>
      </UiButton>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Создать аккаунт</h1>
      <p class="text-sm text-[var(--text-muted)] mt-0.5">Новый договор и привязка к пользователю</p>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400"
    >
      <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 shrink-0" />
      <span>{{ error }}</span>
    </div>

    <!-- Form: две колонки на десктопе — слева Владелец+Договор, справа Адрес+Заметки -->
    <div class="max-w-5xl">
      <form @submit.prevent="createAccount">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Левая колонка -->
          <div class="space-y-6">
            <!-- Владелец -->
            <UiCard>
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--glass-border)]">
            <span
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary"
            >
              <Icon name="heroicons:user" class="w-5 h-5" />
            </span>
            <span class="font-semibold text-[var(--text-primary)]">Владелец</span>
          </div>

          <div class="user-search-container relative">
            <label class="block text-sm font-medium text-[var(--text-muted)] mb-2">Пользователь</label>

            <div
              v-if="selectedUser"
              class="flex items-center gap-3 p-4 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] ring-1 ring-transparent hover:ring-primary/20 transition-all"
            >
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 text-base font-semibold text-primary"
              >
                {{ (selectedUser.fullName || '?')[0]?.toUpperCase() ?? '?' }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="font-medium text-[var(--text-primary)]">{{ selectedUser.fullName }}</p>
                <p class="text-sm text-[var(--text-muted)]">
                  {{ selectedUser.phone || selectedUser.email || 'Контакты не указаны' }}
                </p>
              </div>
              <UiButton @click="clearUser" variant="ghost" size="sm" title="Снять выбор">
                <Icon name="heroicons:x-mark" class="w-4 h-4" />
              </UiButton>
            </div>

            <div v-else>
              <UiInput
                v-model="userSearch"
                @input="onUserSearchInput"
                @focus="showUserDropdown = true"
                placeholder="Поиск по имени, телефону, email..."
              >
                <template #leading>
                  <Icon name="heroicons:magnifying-glass" class="w-4 h-4 text-[var(--text-muted)]" />
                </template>
                <template #trailing>
                  <Icon v-if="userSearchLoading" name="heroicons:arrow-path" class="w-4 h-4 animate-spin text-[var(--text-muted)]" />
                </template>
              </UiInput>

              <!-- Dropdown -->
              <div
                v-if="showUserDropdown && (userSearchResults.length > 0 || userSearch.length >= 2)"
                class="absolute z-10 w-full mt-1.5 py-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--glass-border)] shadow-xl max-h-60 overflow-y-auto"
              >
                <div
                  v-for="user in userSearchResults"
                  :key="user.id"
                  @click="selectUser(user)"
                  class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[var(--glass-bg)] transition-colors"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary"
                  >
                    {{ (user.fullName || '?')[0]?.toUpperCase() ?? '?' }}
                  </span>
                  <div class="min-w-0">
                    <p class="font-medium text-[var(--text-primary)]">{{ user.fullName }}</p>
                    <p class="text-sm text-[var(--text-muted)] truncate">
                      {{ user.phone || user.email || 'Контакты не указаны' }}
                    </p>
                  </div>
                </div>
                <div
                  v-if="userSearchResults.length === 0 && userSearch.length >= 2 && !userSearchLoading"
                  class="flex items-center gap-2 px-4 py-3 text-[var(--text-muted)]"
                >
                  <Icon name="heroicons:user-plus" class="w-4 h-4 shrink-0" />
                  Пользователи не найдены
                </div>
              </div>
            </div>

            <p class="mt-2 text-xs text-[var(--text-muted)]">
              Можно оставить пустым и привязать пользователя позже
            </p>
          </div>
        </UiCard>

            <!-- Договор -->
            <UiCard>
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--glass-border)]">
            <span
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary"
            >
              <Icon name="heroicons:document-text" class="w-5 h-5" />
            </span>
            <span class="font-semibold text-[var(--text-primary)]">Договор</span>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <UiInput
                v-model.number="form.contractNumber"
                label="Номер договора"
                type="number"
                placeholder="12345"
              />
              <UiSelect
                v-model="form.contractStatus"
                :options="contractStatusOptions"
                :placeholder="undefined"
                label="Статус договора"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <UiInput
                v-model="form.startDate"
                label="Дата начала"
                type="date"
              />
              <UiInput
                v-model="form.endDate"
                label="Дата окончания"
                type="date"
              />
            </div>
          </div>
        </UiCard>
          </div>

          <!-- Правая колонка -->
          <div class="space-y-6">
            <!-- Адрес -->
            <UiCard>
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--glass-border)]">
            <span
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary"
            >
              <Icon name="heroicons:map-pin" class="w-5 h-5" />
            </span>
            <span class="font-semibold text-[var(--text-primary)]">Адрес</span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UiInput v-model="form.address.city" label="Город" placeholder="Ростов-на-Дону" />
            <UiInput v-model="form.address.district" label="Район" placeholder="Советский" />
            <UiInput v-model="form.address.street" label="Улица" placeholder="ул. Пушкинская" />
            <UiInput v-model="form.address.building" label="Дом" placeholder="1" />
            <UiInput v-model="form.address.apartment" label="Квартира" placeholder="1" />
            <UiInput v-model="form.address.entrance" label="Подъезд" placeholder="1" />
            <UiInput v-model="form.address.floor" label="Этаж" placeholder="1" />
            <UiInput v-model="form.address.intercom" label="Домофон" placeholder="1" />
          </div>
        </UiCard>

            <!-- Заметки -->
            <UiCard>
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--glass-border)]">
            <span
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary"
            >
              <Icon name="heroicons:chat-bubble-left-ellipsis" class="w-5 h-5" />
            </span>
            <span class="font-semibold text-[var(--text-primary)]">Заметки</span>
          </div>

          <textarea
            v-model="form.notes"
            rows="3"
            placeholder="Дополнительные заметки к договору..."
            class="w-full min-h-[80px] px-4 py-3 rounded-xl text-[var(--text-primary)] border border-[var(--glass-border)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-[var(--glass-bg)] resize-y"
          />
        </UiCard>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-[var(--glass-border)]">
          <UiButton :loading="saving" :disabled="saving" type="submit">
            <Icon name="heroicons:plus" class="w-4 h-4" />
            Создать аккаунт
          </UiButton>
          <UiButton :disabled="saving" @click="cancel" variant="ghost">
            Отмена
          </UiButton>
          <span class="text-xs text-[var(--text-muted)] ml-auto">Esc — отмена и возврат к списку</span>
        </div>
      </form>
    </div>
  </div>
</template>
