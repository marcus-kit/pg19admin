<script setup lang="ts">
import { getErrorStatusCode, getErrorMessage, formatBalance, formatDate, formatDateTime } from '~/composables/useFormatters'

definePageMeta({
  middleware: 'admin',
})

const toast = useToast()
const route = useRoute()
const router = useRouter()
const accountId = computed(() => route.params.id as string)

useHead({ title: 'Аккаунт — Админ-панель' })

interface User {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string | null
  phone: string | null
  avatar: string | null
  status: string
}

interface Account {
  id: string
  contractNumber: number | null
  contractStatus: 'draft' | 'active' | 'terminated' | 'stopped'
  status: 'active' | 'blocked' | 'closed'
  balance: number
  startDate: string | null
  endDate: string | null
  blockedAt: string | null
  notes: string | null
  address: {
    full: string | null
    city: string | null
    district: string | null
    street: string | null
    building: string | null
    apartment: string | null
    entrance: string | null
    floor: string | null
    intercom: string | null
  }
  user: User | null
  createdAt: string
  updatedAt: string
}

const loading = ref(true)
const saving = ref(false)
const account = ref<Account | null>(null)

const showEditModal = ref(false)
const editForm = ref({
  contractNumber: null as number | null,
  contractStatus: '' as string,
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

const fetchAccount = async () => {
  loading.value = true
  try {
    const data = await $fetch<{ account: Account }>(`/api/admin/accounts/${accountId.value}`)
    account.value = data.account
  }
  catch (error: unknown) {
    toast.error('Не удалось загрузить аккаунт')
    if (getErrorStatusCode(error) === 404) {
      router.push('/accounts')
    }
  }
  finally {
    loading.value = false
  }
}

const openEditModal = () => {
  if (!account.value) return
  editForm.value = {
    contractNumber: account.value.contractNumber,
    contractStatus: account.value.contractStatus,
    startDate: account.value.startDate?.split('T')[0] || '',
    endDate: account.value.endDate?.split('T')[0] || '',
    notes: account.value.notes || '',
    address: {
      city: account.value.address.city || '',
      district: account.value.address.district || '',
      street: account.value.address.street || '',
      building: account.value.address.building || '',
      apartment: account.value.address.apartment || '',
      entrance: account.value.address.entrance || '',
      floor: account.value.address.floor || '',
      intercom: account.value.address.intercom || '',
    },
  }
  showEditModal.value = true
}

const saveAccount = async () => {
  if (!account.value || saving.value) return

  saving.value = true
  try {
    await $fetch(`/api/admin/accounts/${accountId.value}`, {
      method: 'PUT',
      body: editForm.value,
    })

    await fetchAccount()
    showEditModal.value = false
    toast.success('Аккаунт сохранён')
  }
  catch (error: unknown) {
    toast.error(getErrorMessage(error) || 'Не удалось сохранить аккаунт')
  }
  finally {
    saving.value = false
  }
}

const updateStatus = async (newStatus: string) => {
  if (!account.value || saving.value) return

  if (!confirm(`Изменить статус аккаунта на "${getStatusLabel(newStatus)}"?`)) return

  saving.value = true
  try {
    await $fetch(`/api/admin/accounts/${accountId.value}/status`, {
      method: 'PUT',
      body: { status: newStatus },
    })

    await fetchAccount()
    toast.success('Статус аккаунта обновлён')
  }
  catch (error: unknown) {
    toast.error(getErrorMessage(error) || 'Не удалось обновить статус')
  }
  finally {
    saving.value = false
  }
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-500/20 text-green-400'
    case 'blocked': return 'bg-red-500/20 text-red-400'
    case 'closed': return 'bg-gray-500/20 text-gray-400'
    default: return 'bg-gray-500/20 text-gray-400'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Активен'
    case 'blocked': return 'Заблокирован'
    case 'closed': return 'Закрыт'
    default: return status
  }
}

const getContractStatusLabel = (status: string) => {
  switch (status) {
    case 'draft': return 'Черновик'
    case 'active': return 'Активный'
    case 'terminated': return 'Расторгнут'
    case 'stopped': return 'Приостановлен'
    default: return status
  }
}

const contractStatusOptions = [
  { value: 'draft', label: 'Черновик' },
  { value: 'active', label: 'Активный' },
  { value: 'terminated', label: 'Расторгнут' },
  { value: 'stopped', label: 'Приостановлен' },
]

onMounted(() => {
  fetchAccount()
})
</script>

<template>
  <div>
    <!-- Loading -->
    <UiLoading v-if="loading" />

    <template v-else-if="account">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <UiButton variant="ghost" size="sm" @click="router.push('/accounts')">
              <Icon name="heroicons:arrow-left" class="w-5 h-5" />
            </UiButton>
            <UiBadge :class="getStatusBadgeClass(account.status)">
              {{ getStatusLabel(account.status) }}
            </UiBadge>
          </div>
          <h1 class="text-2xl font-bold text-[var(--text-primary)]">
            Договор {{ account.contractNumber || '—' }}
          </h1>
          <p class="text-[var(--text-muted)]">{{ account.address.full || 'Адрес не указан' }}</p>
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
          <!-- Contract Info -->
          <UiCard>
            <template #header>
              <span class="font-medium text-[var(--text-primary)]">Информация о договоре</span>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Номер договора</label>
                <p class="text-[var(--text-primary)] font-mono">{{ account.contractNumber || '—' }}</p>
              </div>
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Статус договора</label>
                <p class="text-[var(--text-primary)]">{{ getContractStatusLabel(account.contractStatus) }}</p>
              </div>
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Дата начала</label>
                <p class="text-[var(--text-primary)]">{{ formatDate(account.startDate) }}</p>
              </div>
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Дата окончания</label>
                <p class="text-[var(--text-primary)]">{{ formatDate(account.endDate) }}</p>
              </div>
            </div>
          </UiCard>

          <!-- Address -->
          <UiCard>
            <template #header>
              <span class="font-medium text-[var(--text-primary)]">Адрес</span>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-xs text-[var(--text-muted)] mb-1">Полный адрес</label>
                <p class="text-[var(--text-primary)]">{{ account.address.full || '—' }}</p>
              </div>
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Город</label>
                <p class="text-[var(--text-primary)]">{{ account.address.city || '—' }}</p>
              </div>
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Район</label>
                <p class="text-[var(--text-primary)]">{{ account.address.district || '—' }}</p>
              </div>
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Улица</label>
                <p class="text-[var(--text-primary)]">{{ account.address.street || '—' }}</p>
              </div>
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Дом</label>
                <p class="text-[var(--text-primary)]">{{ account.address.building || '—' }}</p>
              </div>
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Квартира</label>
                <p class="text-[var(--text-primary)]">{{ account.address.apartment || '—' }}</p>
              </div>
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Подъезд / Этаж / Домофон</label>
                <p class="text-[var(--text-primary)]">
                  {{ [account.address.entrance, account.address.floor, account.address.intercom].filter(Boolean).join(' / ') || '—' }}
                </p>
              </div>
            </div>
          </UiCard>

          <!-- Notes -->
          <UiCard v-if="account.notes">
            <template #header>
              <span class="font-medium text-[var(--text-primary)]">Заметки</span>
            </template>
            <p class="text-[var(--text-secondary)] whitespace-pre-wrap">{{ account.notes }}</p>
          </UiCard>

          <!-- User Info -->
          <UiCard v-if="account.user">
            <template #header>
              <span class="font-medium text-[var(--text-primary)]">Владелец</span>
            </template>

            <div
              class="flex items-center gap-4 p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:border-primary/30 cursor-pointer transition-colors"
              @click="router.push(`/users/${account.user.id}`)"
            >
              <div
                v-if="account.user.avatar"
                :style="{ backgroundImage: `url(${account.user.avatar})` }"
                class="w-12 h-12 rounded-full bg-cover bg-center"
              />
              <div
                v-else
                class="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center"
              >
                <span class="font-medium text-[var(--text-primary)]">
                  {{ account.user.firstName?.charAt(0) || '?' }}{{ account.user.lastName?.charAt(0) || '' }}
                </span>
              </div>
              <div>
                <p class="font-medium text-[var(--text-primary)]">{{ account.user.fullName }}</p>
                <p class="text-sm text-[var(--text-muted)]">
                  {{ account.user.phone || account.user.email || 'Контакты не указаны' }}
                </p>
              </div>
            </div>
          </UiCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Balance -->
          <UiCard>
            <template #header>
              <span class="font-medium text-[var(--text-primary)]">Баланс</span>
            </template>

            <div class="text-center py-4">
              <p
                :class="[
                  'text-3xl font-bold',
                  account.balance >= 0 ? 'text-green-400' : 'text-red-400',
                ]"
              >
                {{ formatBalance(account.balance) }}
              </p>
            </div>
          </UiCard>

          <!-- Status Management -->
          <UiCard>
            <template #header>
              <span class="font-medium text-[var(--text-primary)]">Управление статусом</span>
            </template>

            <div class="space-y-2">
              <UiButton
                v-if="account.status !== 'active'"
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
                v-if="account.status !== 'blocked'"
                :disabled="saving"
                variant="secondary"
                size="sm"
                class="w-full justify-center"
                @click="updateStatus('blocked')"
              >
                <Icon name="heroicons:no-symbol" class="w-4 h-4 text-red-400" />
                Заблокировать
              </UiButton>
              <UiButton
                v-if="account.status !== 'closed'"
                :disabled="saving"
                variant="secondary"
                size="sm"
                class="w-full justify-center"
                @click="updateStatus('closed')"
              >
                <Icon name="heroicons:x-circle" class="w-4 h-4 text-gray-400" />
                Закрыть
              </UiButton>
            </div>

            <div v-if="account.blockedAt" class="mt-4 pt-4 border-t border-[var(--glass-border)]">
              <p class="text-xs text-[var(--text-muted)]">Заблокирован:</p>
              <p class="text-sm text-red-400">{{ formatDateTime(account.blockedAt) }}</p>
            </div>
          </UiCard>

          <!-- Dates -->
          <UiCard>
            <template #header>
              <span class="font-medium text-[var(--text-primary)]">Даты</span>
            </template>

            <div class="space-y-3 text-sm">
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Создан</label>
                <p class="text-[var(--text-primary)]">{{ formatDateTime(account.createdAt) }}</p>
              </div>
              <div>
                <label class="block text-xs text-[var(--text-muted)] mb-1">Обновлён</label>
                <p class="text-[var(--text-primary)]">{{ formatDateTime(account.updatedAt) }}</p>
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
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showEditModal = false"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div class="relative w-full max-w-2xl glass-card rounded-xl p-6 max-h-[90vh] overflow-y-auto">
          <h3 class="text-xl font-bold text-[var(--text-primary)] mb-6">Редактировать аккаунт</h3>

          <form class="space-y-6" @submit.prevent="saveAccount">
            <!-- Contract Info -->
            <div>
              <h4 class="text-sm font-medium text-[var(--text-muted)] mb-3">Договор</h4>
              <div class="grid grid-cols-2 gap-4">
                <UiInput
                  v-model.number="editForm.contractNumber"
                  label="Номер договора"
                  type="number"
                  placeholder="12345"
                />
                <UiSelect
                  v-model="editForm.contractStatus"
                  :options="contractStatusOptions"
                  :placeholder="undefined"
                  label="Статус договора"
                />
                <UiInput v-model="editForm.startDate" label="Дата начала" type="date" />
                <UiInput v-model="editForm.endDate" label="Дата окончания" type="date" />
              </div>
            </div>

            <!-- Address -->
            <div>
              <h4 class="text-sm font-medium text-[var(--text-muted)] mb-3">Адрес</h4>
              <div class="grid grid-cols-2 gap-4">
                <UiInput v-model="editForm.address.city" label="Город" placeholder="Ростов-на-Дону" />
                <UiInput v-model="editForm.address.district" label="Район" placeholder="Советский" />
                <UiInput v-model="editForm.address.street" label="Улица" placeholder="ул. Пушкинская" />
                <UiInput v-model="editForm.address.building" label="Дом" placeholder="1" />
                <UiInput v-model="editForm.address.apartment" label="Квартира" placeholder="1" />
                <UiInput v-model="editForm.address.entrance" label="Подъезд" placeholder="1" />
                <UiInput v-model="editForm.address.floor" label="Этаж" placeholder="1" />
                <UiInput v-model="editForm.address.intercom" label="Домофон" placeholder="1" />
              </div>
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-sm font-medium text-[var(--text-muted)] mb-2">Заметки</label>
              <textarea
                v-model="editForm.notes"
                rows="3"
                class="w-full px-4 py-3 glass-card rounded-lg text-[var(--text-primary)] border border-[var(--glass-border)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-[var(--glass-bg)] resize-none"
                placeholder="Заметки..."
              />
            </div>

            <div class="flex justify-end gap-3 pt-4">
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
