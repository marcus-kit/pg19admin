<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Создать пользователя — Админ-панель' })

const toast = useToast()
const router = useRouter()

// Данные формы
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
  regApartment: '',
})

const saving = ref(false)
const error = ref('')

async function createUser() {
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
    const response = await $fetch<{ success: boolean, user: { id: string } }>('/api/admin/users', {
      method: 'POST',
      body: form.value,
    })

    if (response.success && response.user?.id) {
      toast.success('Пользователь создан')
      router.push(`/users/${response.user.id}`)
    }
  }
  catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Ошибка при создании пользователя'
    error.value = message
    toast.error('Не удалось создать пользователя')
  }
  finally {
    saving.value = false
  }
}

function cancel() {
  router.push('/users')
}
</script>

<template>
  <div class="user-create-page">
    <!-- Hero: градиент + кнопка назад + заголовок -->
    <header class="user-create-page__hero">
      <div class="user-create-page__hero-bg" aria-hidden="true" />
      <div class="user-create-page__hero-inner">
        <button
          type="button"
          class="user-create-page__back"
          aria-label="Назад к списку"
          @click="cancel"
        >
          <Icon name="heroicons:arrow-left" class="w-5 h-5" />
        </button>
        <div class="flex items-center gap-3">
          <div class="user-create-page__hero-icon">
            <Icon name="heroicons:user-plus" class="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 class="user-create-page__hero-title">
              Создать пользователя
            </h1>
            <p class="user-create-page__hero-subtitle">
              Заполните данные нового пользователя
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- Ошибка -->
    <div v-if="error" class="user-create-page__error" role="alert">
      {{ error }}
    </div>

    <!-- Форма в glass-карточке -->
    <div class="user-create-page__main glass-card glass-card-static">
      <form @submit.prevent="createUser" class="user-create-page__form">
        <!-- Основные данные -->
        <section class="user-create-page__section">
          <h2 class="user-create-page__section-title">
            Основные данные
          </h2>
          <div class="user-create-page__fields">
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
        </section>

        <!-- Паспортные данные -->
        <section class="user-create-page__section">
          <h2 class="user-create-page__section-title">
            Паспортные данные
          </h2>
          <div class="user-create-page__fields grid grid-cols-2 gap-4">
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
        </section>

        <!-- Адрес регистрации -->
        <section class="user-create-page__section">
          <h2 class="user-create-page__section-title">
            Адрес регистрации
          </h2>
          <div class="user-create-page__fields space-y-4">
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
        </section>

        <!-- Кнопки -->
        <div class="user-create-page__actions">
          <UiButton :loading="saving" :disabled="saving" type="submit">
            <Icon name="heroicons:plus" class="w-4 h-4" />
            Создать
          </UiButton>
          <UiButton :disabled="saving" variant="secondary" @click="cancel">
            Отмена
          </UiButton>
        </div>
      </form>
    </div>
  </div>
</template>
