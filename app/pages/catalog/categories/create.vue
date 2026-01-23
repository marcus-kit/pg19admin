<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

useHead({ title: 'Создать категорию — Админ-панель' })

const toast = useToast()
const router = useRouter()

const form = reactive({
  name: '',
  slug: '',
  description: '',
  icon: 'heroicons:folder',
  sortOrder: 0,
  isActive: true
})

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
  { label: 'Телефон', value: 'heroicons:phone' }
]

const generateSlug = () => {
  if (!form.slug && form.name) {
    form.slug = form.name
      .toLowerCase()
      .replace(/[а-яё]/g, (char) => {
        const map: Record<string, string> = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
          'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
          'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
          'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
          'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        }
        return map[char] || char
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

const save = async () => {
  if (!form.name.trim()) {
    error.value = 'Введите название категории'
    return
  }

  if (!form.slug.trim()) {
    error.value = 'Введите URL категории'
    return
  }

  saving.value = true
  error.value = ''

  try {
    await $fetch('/api/admin/catalog/categories', {
      method: 'POST',
      body: {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        icon: form.icon || null,
        sortOrder: form.sortOrder,
        isActive: form.isActive
      }
    })

    toast.success('Категория создана')
    router.push('/catalog')
  } catch (err: any) {
    console.error('Failed to create category:', err)
    error.value = err.data?.message || 'Ошибка при создании категории'
    toast.error('Не удалось создать категорию')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-[var(--text-primary)]">
        Создать категорию
      </h1>
    </div>

    <div v-if="error" class="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
      {{ error }}
    </div>

    <form @submit.prevent="save" class="space-y-6 max-w-2xl">
      <div>
        <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Название *
        </label>
        <UiInput
          v-model="form.name"
          placeholder="Например: Интернет"
          size="lg"
          @blur="generateSlug"
        />
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
        <UiButton type="submit" :loading="saving" :disabled="saving">
          Сохранить
        </UiButton>
        <UiButton variant="ghost" @click="router.push('/catalog')" :disabled="saving">
          Отмена
        </UiButton>
      </div>
    </form>
  </div>
</template>
