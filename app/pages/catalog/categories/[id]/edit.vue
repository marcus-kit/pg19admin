<script setup lang="ts">
// Интерфейс ответа API для категории
interface CategoryResponse {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sortOrder: number
  isActive: boolean
}

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Редактировать категорию — Админ-панель' })

const toast = useToast()
const router = useRouter()
const route = useRoute()
const categoryId = computed(() => route.params.id as string)

const form = reactive({
  name: '',
  slug: '',
  description: '',
  icon: 'heroicons:folder',
  sortOrder: 0,
  isActive: true,
})

const loading = ref(true)
const saving = ref(false)
const error = ref('')

const iconOptions = [
  { label: 'Папка', value: 'heroicons:folder' },
  { label: 'Wi-Fi', value: 'heroicons:wifi' },
  { label: 'ТВ', value: 'heroicons:tv' },
  { label: 'Плюс', value: 'heroicons:plus-circle' },
  { label: 'Звезда', value: 'heroicons:star' },
  { label: 'Молния', value: 'heroicons:bolt' },
  { label: 'Глобус', value: 'heroicons:globe-alt' },
  { label: 'Телефон', value: 'heroicons:phone' },
]

const fetchCategory = async () => {
  loading.value = true
  try {
    const data = await $fetch<{ category: CategoryResponse }>(`/api/admin/catalog/categories/${categoryId.value}`)
    const cat = data.category
    form.name = cat.name
    form.slug = cat.slug
    form.description = cat.description || ''
    form.icon = cat.icon || 'heroicons:folder'
    form.sortOrder = cat.sortOrder
    form.isActive = cat.isActive
  }
  catch (err: unknown) {
    console.error('Failed to fetch category:', err)
    error.value = 'Ошибка при загрузке категории'
    toast.error('Не удалось загрузить категорию')
  }
  finally {
    loading.value = false
  }
}

const save = async () => {
  if (!form.name.trim()) {
    error.value = 'Введите название категории'
    return
  }

  saving.value = true
  error.value = ''

  try {
    await $fetch(`/api/admin/catalog/categories/${categoryId.value}`, {
      method: 'PUT',
      body: {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        icon: form.icon || null,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      },
    })

    toast.success('Категория сохранена')
    router.push('/catalog')
  }
  catch (err: unknown) {
    console.error('Failed to update category:', err)
    error.value = 'Ошибка при обновлении категории'
    toast.error('Не удалось сохранить категорию')
  }
  finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchCategory()
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-[var(--text-primary)]">
        Редактировать категорию
      </h1>
    </div>

    <UiLoading v-if="loading" />

    <div v-else-if="error && !form.name" class="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
      {{ error }}
    </div>

    <form v-else class="space-y-6 max-w-2xl" @submit.prevent="save">
      <div v-if="error" class="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
        {{ error }}
      </div>

      <div>
        <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Название *
        </label>
        <UiInput v-model="form.name" placeholder="Например: Интернет" size="lg" />
      </div>

      <div>
        <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
          URL (slug) *
        </label>
        <div class="flex items-center gap-2">
          <span class="text-[var(--text-muted)]">/</span>
          <UiInput v-model="form.slug" placeholder="internet" class="flex-1 font-mono" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Описание
        </label>
        <textarea
          v-model="form.description"
          placeholder="Описание категории"
          rows="3"
          class="w-full px-4 py-3 glass-card rounded-lg text-[var(--text-primary)] border border-[var(--glass-border)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-[var(--glass-bg)] resize-none"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Иконка
          </label>
          <div class="flex items-center gap-3">
            <div class="flex-1">
              <UiSelect
                v-model="form.icon"
                :options="iconOptions"
                :placeholder="undefined"
              />
            </div>
            <div class="w-12 h-12 flex items-center justify-center glass-card rounded-xl">
              <Icon :name="form.icon" class="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Порядок сортировки
          </label>
          <UiInput v-model.number="form.sortOrder" type="number" placeholder="0" />
        </div>
      </div>

      <div class="flex items-center gap-3">
        <input
          v-model="form.isActive"
          type="checkbox"
          id="isActive"
          class="w-5 h-5 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary"
        />
        <label for="isActive" class="text-sm text-[var(--text-secondary)] cursor-pointer">
          Активна
        </label>
      </div>

      <div class="flex gap-3">
        <UiButton :loading="saving" :disabled="saving" type="submit">
          Сохранить изменения
        </UiButton>
        <UiButton :disabled="saving" variant="ghost" @click="router.push('/catalog')">
          Отмена
        </UiButton>
      </div>
    </form>
  </div>
</template>
