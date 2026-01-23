<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

useHead({ title: 'Создать пользователя — Админ-панель' })

const toast = useToast()
const router = useRouter()

const saving = ref(false)
const error = ref('')

const form = ref({
  firstName: '',
  lastName: '',
  middleName: '',
  phone: '',
  email: '',
  birthDate: '',
  telegramUsername: '',
  vkId: '',
  passportSeries: '',
  passportNumber: '',
  regCity: '',
  regStreet: '',
  regBuilding: '',
  regApartment: ''
})

const createUser = async () => {
  if (saving.value) return

  error.value = ''

  if (!form.value.firstName.trim()) {
    error.value = 'Введите имя'
    return
  }

  if (!form.value.lastName.trim()) {
    error.value = 'Введите фамилию'
    return
  }

  saving.value = true
  try {
    const response = await $fetch<{ success: boolean; user: { id: string } }>('/api/admin/users', {
      method: 'POST',
      body: form.value
    })

    if (response.success && response.user?.id) {
      toast.success('Пользователь создан')
      router.push(`/users/${response.user.id}`)
    }
  } catch (e: any) {
    error.value = e.data?.message || 'Ошибка при создании пользователя'
    toast.error('Не удалось создать пользователя')
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  router.push('/users')
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <UiButton variant="ghost" size="sm" @click="cancel">
        <Icon name="heroicons:arrow-left" class="w-5 h-5" />
      </UiButton>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Создать пользователя</h1>
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
      {{ error }}
    </div>

    <!-- Form -->
    <div class="max-w-2xl">
      <form @submit.prevent="createUser" class="space-y-6">
        <!-- Основные данные -->
        <UiCard>
          <template #header>
            <span class="font-medium text-[var(--text-primary)]">Основные данные</span>
          </template>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <UiInput
                v-model="form.lastName"
                label="Фамилия *"
                placeholder="Иванов"
                required
              />
              <UiInput
                v-model="form.firstName"
                label="Имя *"
                placeholder="Иван"
                required
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <UiInput
                v-model="form.middleName"
                label="Отчество"
                placeholder="Иванович"
              />
              <UiInput
                v-model="form.birthDate"
                label="Дата рождения"
                type="date"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <UiInput
                v-model="form.phone"
                label="Телефон"
                placeholder="+7 900 000-00-00"
              />
              <UiInput
                v-model="form.email"
                label="Email"
                type="email"
                placeholder="user@example.com"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <UiInput
                v-model="form.telegramUsername"
                label="Telegram"
                placeholder="username"
              />
              <UiInput
                v-model="form.vkId"
                label="VK ID"
                placeholder="123456789"
              />
            </div>
          </div>
        </UiCard>

        <!-- Паспортные данные -->
        <UiCard>
          <template #header>
            <span class="font-medium text-[var(--text-primary)]">Паспортные данные</span>
          </template>

          <div class="grid grid-cols-2 gap-4">
            <UiInput
              v-model="form.passportSeries"
              label="Серия"
              placeholder="6020"
              maxlength="4"
            />
            <UiInput
              v-model="form.passportNumber"
              label="Номер"
              placeholder="123456"
              maxlength="6"
            />
          </div>
        </UiCard>

        <!-- Адрес регистрации -->
        <UiCard>
          <template #header>
            <span class="font-medium text-[var(--text-primary)]">Адрес регистрации</span>
          </template>

          <div class="space-y-4">
            <UiInput
              v-model="form.regCity"
              label="Город"
              placeholder="Ростов-на-Дону"
            />
            <UiInput
              v-model="form.regStreet"
              label="Улица"
              placeholder="ул. Пушкинская"
            />
            <div class="grid grid-cols-2 gap-4">
              <UiInput
                v-model="form.regBuilding"
                label="Дом"
                placeholder="1"
              />
              <UiInput
                v-model="form.regApartment"
                label="Квартира"
                placeholder="1"
              />
            </div>
          </div>
        </UiCard>

        <!-- Actions -->
        <div class="flex gap-3">
          <UiButton type="submit" :loading="saving" :disabled="saving">
            <Icon name="heroicons:plus" class="w-4 h-4" />
            Создать
          </UiButton>
          <UiButton variant="ghost" @click="cancel" :disabled="saving">
            Отмена
          </UiButton>
        </div>
      </form>
    </div>
  </div>
</template>
