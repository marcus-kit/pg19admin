<script setup lang="ts">
import { getErrorStatusCode, getErrorMessage, formatBalance, formatDate, formatDateTime } from '~/composables/useFormatters'

// Типы данных
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

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Пользователь — Админ-панель' })

const toast = useToast()
const route = useRoute()
const router = useRouter()

// Состояние страницы
const loading = ref(true) // Загрузка данных
const saving = ref(false) // Сохранение изменений
const user = ref<User | null>(null) // Данные пользователя
const showEditModal = ref(false) // Открыто ли модальное окно

// Форма редактирования
const editForm = ref({
  firstName: '',
  lastName: '',
  middleName: '',
  email: '',
  phone: '',
  birthDate: '',
  telegramUsername: '',
  vkId: '',
  passportSeries: '',
  passportNumber: '',
  regCity: '',
  regStreet: '',
  regBuilding: '',
  regApartment: '',
})

const userId = computed(() => route.params.id as string)

// Загрузка данных пользователя
async function fetchUser() {
  loading.value = true
  try {
    const data = await $fetch<{ user: User }>(`/api/admin/users/${userId.value}`)
    user.value = data.user
  }
  catch (error: unknown) {
    toast.error('Не удалось загрузить пользователя')
    if (getErrorStatusCode(error) === 404) {
      router.push('/users')
    }
  }
  finally {
    loading.value = false
  }
}

// Открытие модального окна редактирования
function openEditModal() {
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
    passportSeries: user.value.passport?.series || '',
    passportNumber: user.value.passport?.number || '',
    regCity: user.value.registrationAddress?.city || '',
    regStreet: user.value.registrationAddress?.street || '',
    regBuilding: user.value.registrationAddress?.building || '',
    regApartment: user.value.registrationAddress?.apartment || '',
  }
  showEditModal.value = true
}

// Сохранение изменений пользователя
async function saveUser() {
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
    toast.error(getErrorMessage(error) || 'Не удалось сохранить пользователя')
  }
  finally {
    saving.value = false
  }
}

// Обновление статуса пользователя
async function updateStatus(newStatus: string) {
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
    toast.error(getErrorMessage(error) || 'Не удалось обновить статус')
  }
  finally {
    saving.value = false
  }
}

// Возвращает класс бейджа статуса пользователя
function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'active': return 'bg-green-500/20 text-green-400'
    case 'suspended': return 'bg-yellow-500/20 text-yellow-400'
    case 'terminated': return 'bg-red-500/20 text-red-400'
    default: return 'bg-gray-500/20 text-gray-400'
  }
}

// Возвращает текст статуса пользователя
function getStatusLabel(status: string) {
  switch (status) {
    case 'active': return 'Активен'
    case 'suspended': return 'Приостановлен'
    case 'terminated': return 'Удалён'
    default: return status
  }
}

// Возвращает класс бейджа статуса аккаунта
function getAccountStatusBadgeClass(status: string) {
  switch (status) {
    case 'active': return 'bg-green-500/20 text-green-400'
    case 'blocked': return 'bg-red-500/20 text-red-400'
    case 'closed': return 'bg-gray-500/20 text-gray-400'
    default: return 'bg-gray-500/20 text-gray-400'
  }
}

// Возвращает текст статуса аккаунта
function getAccountStatusLabel(status: string) {
  switch (status) {
    case 'active': return 'Активен'
    case 'blocked': return 'Заблокирован'
    case 'closed': return 'Закрыт'
    default: return status
  }
}

onMounted(() => {
  fetchUser()
})
</script>

<template>
  <div class="user-detail-page">
    <header class="user-detail-page__hero">
      <div class="user-detail-page__hero-bg" aria-hidden="true" />
      <div class="user-detail-page__hero-inner">
        <div class="user-detail-page__hero-row">
          <button type="button" class="user-detail-page__back" aria-label="Назад" @click="router.back()">
            <Icon name="heroicons:arrow-left" class="w-5 h-5" />
          </button>
          <div class="user-detail-page__hero-head">
            <div v-if="user" class="user-detail-page__hero-avatar">
              <div
                v-if="user.avatar"
                :style="{ backgroundImage: `url(${user.avatar})` }"
                class="user-detail-page__hero-avatar-img"
              />
              <span
                v-else
                class="user-detail-page__hero-avatar-initials"
              >
                {{ user.firstName?.charAt(0) || '?' }}{{ user.lastName?.charAt(0) || '' }}
              </span>
            </div>
            <div v-else class="user-detail-page__hero-icon">
              <Icon name="heroicons:user-circle" class="w-7 h-7 text-primary" />
            </div>
            <div class="user-detail-page__hero-title-wrap">
              <h1 class="user-detail-page__hero-title">
                {{ user ? user.fullName : 'Пользователь' }}
              </h1>
              <p class="user-detail-page__hero-subtitle">
                {{ user?.nickname ? `@${user.nickname}` : 'Карточка пользователя' }}
              </p>
            </div>
          </div>
          <button
            v-if="user"
            type="button"
            class="user-detail-page__btn-edit"
            @click="openEditModal"
          >
            <Icon name="heroicons:pencil" class="w-4 h-4" />
            <span>Редактировать</span>
          </button>
        </div>
        <div v-if="user" class="user-detail-page__hero-badges">
          <UiBadge :class="getStatusBadgeClass(user.status)" size="sm">
            {{ getStatusLabel(user.status) }}
          </UiBadge>
        </div>
      </div>
    </header>

    <UiLoading v-if="loading" class="user-detail-page__loading" />

    <template v-else-if="user">
      <div class="user-detail-page__layout">
        <div class="user-detail-page__main">
          <!-- Contact Info -->
          <section class="user-detail-page__card glass-card glass-card-static">
            <h2 class="user-detail-page__card-title">Контактная информация</h2>
            <dl class="user-detail-page__dl user-detail-page__dl--grid">
              <div class="user-detail-page__row">
                <dt class="user-detail-page__dt">Телефон</dt>
                <dd class="user-detail-page__dd">{{ user.phone || '—' }}</dd>
              </div>
              <div class="user-detail-page__row">
                <dt class="user-detail-page__dt">Email</dt>
                <dd class="user-detail-page__dd">{{ user.email || '—' }}</dd>
              </div>
              <div class="user-detail-page__row">
                <dt class="user-detail-page__dt">Telegram</dt>
                <dd class="user-detail-page__dd">
                  <template v-if="user.telegram">
                    <span v-if="user.telegram.username">@{{ user.telegram.username }}</span>
                    <span v-else>ID: {{ user.telegram.id }}</span>
                  </template>
                  <template v-else>—</template>
                </dd>
              </div>
              <div class="user-detail-page__row">
                <dt class="user-detail-page__dt">VK</dt>
                <dd class="user-detail-page__dd">{{ user.vkId || '—' }}</dd>
              </div>
              <div class="user-detail-page__row">
                <dt class="user-detail-page__dt">Дата рождения</dt>
                <dd class="user-detail-page__dd">{{ formatDate(user.birthDate) }}</dd>
              </div>
            </dl>
          </section>

          <!-- Accounts -->
          <section class="user-detail-page__card glass-card glass-card-static">
            <h2 class="user-detail-page__card-title">Аккаунты ({{ user.accounts.length }})</h2>

            <div v-if="user.accounts.length > 0" class="user-detail-page__accounts">
              <div
                v-for="account in user.accounts"
                :key="account.id"
                class="user-detail-page__account"
                @click="router.push(`/accounts/${account.id}`)"
              >
                <div class="user-detail-page__account-head">
                  <span class="user-detail-page__account-contract">
                    Договор {{ account.contractNumber || '—' }}
                  </span>
                  <UiBadge :class="getAccountStatusBadgeClass(account.status)" size="sm">
                    {{ getAccountStatusLabel(account.status) }}
                  </UiBadge>
                </div>
                <div class="user-detail-page__account-meta">
                  <span class="user-detail-page__account-address">{{ account.addressFull || 'Адрес не указан' }}</span>
                  <span :class="account.balance >= 0 ? 'user-detail-page__balance--positive' : 'user-detail-page__balance--negative'">
                    {{ formatBalance(account.balance) }}
                  </span>
                </div>
              </div>
            </div>

            <p v-else class="user-detail-page__empty">Нет связанных аккаунтов</p>
          </section>

          <!-- Registration Data -->
          <section v-if="user.passport || user.registrationAddress" class="user-detail-page__card glass-card glass-card-static">
            <h2 class="user-detail-page__card-title">Регистрационные данные</h2>
            <dl class="user-detail-page__dl user-detail-page__dl--grid">
              <div v-if="user.passport" class="user-detail-page__row">
                <dt class="user-detail-page__dt">Паспорт</dt>
                <dd class="user-detail-page__dd">{{ user.passport.series }} {{ user.passport.number }}</dd>
              </div>
              <div v-if="user.registrationAddress" class="user-detail-page__row">
                <dt class="user-detail-page__dt">Адрес регистрации</dt>
                <dd class="user-detail-page__dd">
                  {{ [user.registrationAddress.city, user.registrationAddress.street, user.registrationAddress.building, user.registrationAddress.apartment].filter(Boolean).join(', ') }}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <aside class="user-detail-page__sidebar">
          <!-- Status Management -->
          <section class="user-detail-page__card glass-card glass-card-static">
            <h2 class="user-detail-page__card-title">Управление статусом</h2>
            <div class="user-detail-page__sidebar-fields">
              <UiButton
                v-if="user.status !== 'active'"
                :disabled="saving"
                @click="updateStatus('active')"
                variant="secondary"
                size="sm"
                class="user-detail-page__status-btn"
              >
                <Icon name="heroicons:check-circle" class="w-4 h-4 text-green-400" />
                Активировать
              </UiButton>
              <UiButton
                v-if="user.status !== 'suspended'"
                :disabled="saving"
                @click="updateStatus('suspended')"
                variant="secondary"
                size="sm"
                class="user-detail-page__status-btn"
              >
                <Icon name="heroicons:pause-circle" class="w-4 h-4 text-yellow-400" />
                Приостановить
              </UiButton>
              <UiButton
                v-if="user.status !== 'terminated'"
                :disabled="saving"
                @click="updateStatus('terminated')"
                variant="secondary"
                size="sm"
                class="user-detail-page__status-btn"
              >
                <Icon name="heroicons:x-circle" class="w-4 h-4 text-red-400" />
                Удалить
              </UiButton>
            </div>
          </section>

          <!-- Dates -->
          <section class="user-detail-page__card glass-card glass-card-static">
            <h2 class="user-detail-page__card-title">Информация</h2>
            <dl class="user-detail-page__dl">
              <div class="user-detail-page__row">
                <dt class="user-detail-page__dt">Создан</dt>
                <dd class="user-detail-page__dd">{{ formatDateTime(user.createdAt) }}</dd>
              </div>
              <div class="user-detail-page__row">
                <dt class="user-detail-page__dt">Обновлён</dt>
                <dd class="user-detail-page__dd">{{ formatDateTime(user.updatedAt) }}</dd>
              </div>
              <div class="user-detail-page__row">
                <dt class="user-detail-page__dt">Последний визит</dt>
                <dd class="user-detail-page__dd">{{ formatDateTime(user.lastSeenAt) }}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </template>

    <!-- Edit Modal -->
    <ClientOnly>
      <Teleport to="body">
        <div
          v-if="showEditModal"
          @click.self="showEditModal = false"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div class="relative w-full max-w-2xl glass-card rounded-xl p-6 my-8">
            <h3 class="text-xl font-bold text-[var(--text-primary)] mb-6">Редактировать пользователя</h3>

            <form @submit.prevent="saveUser" class="space-y-6">
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
                <UiButton :disabled="saving" @click="showEditModal = false" variant="ghost">
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
    </ClientOnly>
  </div>
</template>
