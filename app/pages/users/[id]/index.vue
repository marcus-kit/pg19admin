<script setup lang="ts">
import { getErrorStatusCode, getErrorMessage } from '~/composables/useFormatters'

definePageMeta({
  middleware: 'admin',
})

const toast = useToast()
const route = useRoute()
const router = useRouter()
const userId = computed(() => route.params.id as string)

useHead({ title: 'Пользователь — Админ-панель' })

interface Account {
  id: string
  contractNumber: number | null
  contractStatus: string
  status: string
  balance: number
  addressFull: string | null
  createdAt: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  fullName: string
  email: string | null
  phone: string | null
  birthDate: string | null
  avatar: string | null
  nickname: string | null
  status: 'active' | 'suspended' | 'terminated'
  telegram: { id: string, username: string | null } | null
  vkId: string | null
  onlineStatus: string
  lastSeenAt: string | null
  notificationsSettings: object | null
  communityNotifications: boolean
  passport: { series: string, number: string } | null
  registrationAddress: { city: string, street: string, building: string, apartment: string } | null
  createdAt: string
  updatedAt: string
  accounts: Account[]
}

const loading = ref(true)
const saving = ref(false)
const user = ref<User | null>(null)

const showEditModal = ref(false)
const editForm = ref({
  firstName: '',
  lastName: '',
  middleName: '',
  email: '',
  phone: '',
  birthDate: '',
  telegramUsername: '',
  vkId: '',
  // Паспортные данные
  passportSeries: '',
  passportNumber: '',
  // Адрес регистрации
  regCity: '',
  regStreet: '',
  regBuilding: '',
  regApartment: '',
})

const fetchUser = async () => {
  loading.value = true
  try {
    const data = await $fetch<{ user: User }>(`/api/admin/users/${userId.value}`)
    user.value = data.user
  }
  catch (error: unknown) {
    console.error('Failed to fetch user:', error)
    toast.error('Не удалось загрузить пользователя')
    if (getErrorStatusCode(error) === 404) {
      router.push('/users')
    }
  }
  finally {
    loading.value = false
  }
}

const openEditModal = () => {
  if (!user.value) return
  editForm.value = {
    firstName: user.value.firstName || '',
    lastName: user.value.lastName || '',
    middleName: user.value.middleName || '',
    email: user.value.email || '',
    phone: user.value.phone || '',
    birthDate: user.value.birthDate || '',
    telegramUsername: user.value.telegram?.username || '',
    vkId: user.value.vkId || '',
    // Паспортные данные
    passportSeries: user.value.passport?.series || '',
    passportNumber: user.value.passport?.number || '',
    // Адрес регистрации
    regCity: user.value.registrationAddress?.city || '',
    regStreet: user.value.registrationAddress?.street || '',
    regBuilding: user.value.registrationAddress?.building || '',
    regApartment: user.value.registrationAddress?.apartment || '',
  }
  showEditModal.value = true
}

const saveUser = async () => {
  if (!user.value || saving.value) return

  saving.value = true
  try {
    await $fetch(`/api/admin/users/${userId.value}`, {
      method: 'PUT',
      body: editForm.value,
    })

    await fetchUser()
    showEditModal.value = false
    toast.success('Пользователь сохранён')
  }
  catch (error: unknown) {
    console.error('Failed to save user:', error)
    toast.error(getErrorMessage(error) || 'Не удалось сохранить пользователя')
  }
  finally {
    saving.value = false
  }
}

const updateStatus = async (newStatus: string) => {
  if (!user.value || saving.value) return

  if (!confirm(`Изменить статус пользователя на "${getStatusLabel(newStatus)}"?`)) return

  saving.value = true
  try {
    await $fetch(`/api/admin/users/${userId.value}/status`, {
      method: 'PUT',
      body: { status: newStatus },
    })

    user.value.status = newStatus as User['status']
    toast.success('Статус пользователя обновлён')
  }
  catch (error: unknown) {
    console.error('Failed to update user status:', error)
    toast.error(getErrorMessage(error) || 'Не удалось обновить статус')
  }
  finally {
    saving.value = false
  }
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-500/20 text-green-400'
    case 'suspended': return 'bg-yellow-500/20 text-yellow-400'
    case 'terminated': return 'bg-red-500/20 text-red-400'
    default: return 'bg-gray-500/20 text-gray-400'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Активен'
    case 'suspended': return 'Приостановлен'
    case 'terminated': return 'Удалён'
    default: return status
  }
}

const getAccountStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-500/20 text-green-400'
    case 'blocked': return 'bg-red-500/20 text-red-400'
    case 'closed': return 'bg-gray-500/20 text-gray-400'
    default: return 'bg-gray-500/20 text-gray-400'
  }
}

const getAccountStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Активен'
    case 'blocked': return 'Заблокирован'
    case 'closed': return 'Закрыт'
    default: return status
  }
}

const formatBalance = (kopeks: number) => {
  return (kopeks / 100).toLocaleString('ru-RU', { minimumFractionDigits: 2 }) + ' ₽'
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  fetchUser()
})
</script>

<template>
  <div>
    <!-- Loading -->
    <UiLoading v-if="loading" />

    <template v-else-if="user">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <UiButton variant="ghost" size="sm" @click="router.push('/users')">
              <Icon name="heroicons:arrow-left" class="w-5 h-5" />
            </UiButton>
            <UiBadge :class="getStatusBadgeClass(user.status)">
              {{ getStatusLabel(user.status) }}
            </UiBadge>
          </div>
          <div class="flex items-center gap-4">
            <!-- Avatar -->
            <div class="relative">
              <div
                v-if="user.avatar"
                :style="{ backgroundImage: `url(${user.avatar})` }"
                class="w-16 h-16 rounded-full bg-cover bg-center"
              />
              <div
                v-else
                class="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center"
              >
                <span class="text-xl font-medium text-[var(--text-primary)]">
                  {{ user.firstName?.charAt(0) || '?' }}{{ user.lastName?.charAt(0) || '' }}
                </span>
              </div>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-[var(--text-primary)]">{{ user.fullName }}</h1>
              <p v-if="user.nickname" class="text-[var(--text-muted)]">@{{ user.nickname }}</p>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <UiButton

            variant="secondary"
            size="sm"
            @click="openEditModal"
          >
            <Icon name="heroicons:pencil" class="w-4 h-4" />
            Редактировать
          </UiButton>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Contact Info -->
          <UiCard>
            <template #header>
              <span class="font-medium text-[var(--text-primary)]">Контактная информация</span>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Телефон</label>
                <p class="text-[var(--text-primary)]">{{ user.phone || '—' }}</p>
              </div>
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Email</label>
                <p class="text-[var(--text-primary)]">{{ user.email || '—' }}</p>
              </div>
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Telegram</label>
                <p class="text-[var(--text-primary)]">
                  <template v-if="user.telegram">
                    <span v-if="user.telegram.username">@{{ user.telegram.username }}</span>
                    <span v-else>ID: {{ user.telegram.id }}</span>
                  </template>
                  <template v-else>—</template>
                </p>
              </div>
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">VK</label>
                <p class="text-[var(--text-primary)]">{{ user.vkId || '—' }}</p>
              </div>
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Дата рождения</label>
                <p class="text-[var(--text-primary)]">{{ formatDate(user.birthDate) }}</p>
              </div>
            </div>
          </UiCard>

          <!-- Accounts -->
          <UiCard>
            <template #header>
              <span class="font-medium text-[var(--text-primary)]">
                Аккаунты ({{ user.accounts.length }})
              </span>
            </template>

            <div v-if="user.accounts.length > 0" class="space-y-3">
              <div
                v-for="account in user.accounts"
                :key="account.id"
                class="p-4 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:border-primary/30 cursor-pointer transition-colors"
                @click="router.push(`/accounts/${account.id}`)"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-mono text-primary">
                    Договор {{ account.contractNumber || '—' }}
                  </span>
                  <UiBadge :class="getAccountStatusBadgeClass(account.status)" size="sm">
                    {{ getAccountStatusLabel(account.status) }}
                  </UiBadge>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-[var(--text-muted)]">{{ account.addressFull || 'Адрес не указан' }}</span>
                  <span :class="account.balance >= 0 ? 'text-green-400' : 'text-red-400'">
                    {{ formatBalance(account.balance) }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-4 text-[var(--text-muted)]">
              Нет связанных аккаунтов
            </div>
          </UiCard>

          <!-- Registration Data (collapsible) -->
          <UiCard v-if="user.passport || user.registrationAddress">
            <template #header>
              <span class="font-medium text-[var(--text-primary)]">Регистрационные данные</span>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-if="user.passport">
                <label class="block text-xs text-[var(--text-muted)] mb-1">Паспорт</label>
                <p class="text-[var(--text-primary)]">
                  {{ user.passport.series }} {{ user.passport.number }}
                </p>
              </div>
              <div v-if="user.registrationAddress">
                <label class="block text-xs text-[var(--text-muted)] mb-1">Адрес регистрации</label>
                <p class="text-[var(--text-primary)]">
                  {{ [user.registrationAddress.city, user.registrationAddress.street, user.registrationAddress.building, user.registrationAddress.apartment].filter(Boolean).join(', ') }}
                </p>
              </div>
            </div>
          </UiCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Status Management -->
          <UiCard>
            <template #header>
              <span class="font-medium text-[var(--text-primary)]">Управление статусом</span>
            </template>

            <div class="space-y-2">
              <UiButton
                v-if="user.status !== 'active'"
                :disabled="saving"
                variant="secondary"
                size="sm"
                class="w-full justify-center"
                @click="updateStatus('active')"
              >
                <Icon name="heroicons:check-circle" class="w-4 h-4 text-green-400" />
                Активировать
              </UiButton>
              <UiButton
                v-if="user.status !== 'suspended'"
                :disabled="saving"
                variant="secondary"
                size="sm"
                class="w-full justify-center"
                @click="updateStatus('suspended')"
              >
                <Icon name="heroicons:pause-circle" class="w-4 h-4 text-yellow-400" />
                Приостановить
              </UiButton>
              <UiButton
                v-if="user.status !== 'terminated'"
                :disabled="saving"
                variant="secondary"
                size="sm"
                class="w-full justify-center"
                @click="updateStatus('terminated')"
              >
                <Icon name="heroicons:x-circle" class="w-4 h-4 text-red-400" />
                Удалить
              </UiButton>
            </div>
          </UiCard>

          <!-- Dates -->
          <UiCard>
            <template #header>
              <span class="font-medium text-[var(--text-primary)]">Информация</span>
            </template>

            <div class="space-y-3 text-sm">
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Создан</label>
                <p class="text-[var(--text-primary)]">{{ formatDateTime(user.createdAt) }}</p>
              </div>
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Обновлён</label>
                <p class="text-[var(--text-primary)]">{{ formatDateTime(user.updatedAt) }}</p>
              </div>
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Последний визит</label>
                <p class="text-[var(--text-primary)]">{{ formatDateTime(user.lastSeenAt) }}</p>
              </div>
            </div>
          </UiCard>
        </div>
      </div>
    </template>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div
        v-if="showEditModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        @click.self="showEditModal = false"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div class="relative w-full max-w-2xl glass-card rounded-xl p-6 my-8">
          <h3 class="text-xl font-bold text-[var(--text-primary)] mb-6">Редактировать пользователя</h3>

          <form class="space-y-6" @submit.prevent="saveUser">
            <!-- Основные данные -->
            <div>
              <h4 class="text-sm font-medium text-[var(--text-muted)] mb-3">Основные данные</h4>
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <UiInput v-model="editForm.lastName" label="Фамилия" placeholder="Иванов" />
                  <UiInput v-model="editForm.firstName" label="Имя" placeholder="Иван" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <UiInput v-model="editForm.middleName" label="Отчество" placeholder="Иванович" />
                  <UiInput v-model="editForm.birthDate" label="Дата рождения" type="date" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <UiInput v-model="editForm.phone" label="Телефон" placeholder="+7 900 000-00-00" />
                  <UiInput v-model="editForm.email" label="Email" type="email" placeholder="user@example.com" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <UiInput v-model="editForm.telegramUsername" label="Telegram" placeholder="username" />
                  <UiInput v-model="editForm.vkId" label="VK ID" placeholder="123456789" />
                </div>
              </div>
            </div>

            <!-- Паспортные данные -->
            <div>
              <h4 class="text-sm font-medium text-[var(--text-muted)] mb-3">Паспортные данные</h4>
              <div class="grid grid-cols-2 gap-4">
                <UiInput v-model="editForm.passportSeries" label="Серия" placeholder="6020" maxlength="4" />
                <UiInput v-model="editForm.passportNumber" label="Номер" placeholder="123456" maxlength="6" />
              </div>
            </div>

            <!-- Адрес регистрации -->
            <div>
              <h4 class="text-sm font-medium text-[var(--text-muted)] mb-3">Адрес регистрации</h4>
              <div class="space-y-4">
                <UiInput v-model="editForm.regCity" label="Город" placeholder="Ростов-на-Дону" />
                <UiInput v-model="editForm.regStreet" label="Улица" placeholder="ул. Пушкинская" />
                <div class="grid grid-cols-2 gap-4">
                  <UiInput v-model="editForm.regBuilding" label="Дом" placeholder="1" />
                  <UiInput v-model="editForm.regApartment" label="Квартира" placeholder="1" />
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-[var(--glass-border)]">
              <UiButton :disabled="saving" variant="ghost" @click="showEditModal = false">
                Отмена
              </UiButton>
              <UiButton :loading="saving" :disabled="saving" type="submit">
                Сохранить
              </UiButton>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
