<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'База знаний AI — Админ-панель' })

const toast = useToast()

// Интерфейс записи базы знаний
interface KnowledgeItem {
  id: string
  category: string | null
  question: string
  answer: string
  keywords: string[]
  priority: number
  isActive: boolean
  hasEmbedding?: boolean
  createdAt: string
  updatedAt: string
}

// Состояние страницы
const loading = ref(false)
const saving = ref(false)
const items = ref<KnowledgeItem[]>([])
const categoryFilter = ref('all')
const statusFilter = ref('active')
const searchQuery = ref('')

// Modal state
const showModal = ref(false)
const editingItem = ref<KnowledgeItem | null>(null)
const formData = ref({
  category: '',
  question: '',
  answer: '',
  keywords: '',
  priority: 0,
  isActive: true,
})

// Доступные категории для записей базы знаний
const categories = [
  { value: '', label: 'Без категории' },
  { value: 'internet', label: 'Интернет' },
  { value: 'tv', label: 'Телевидение' },
  { value: 'billing', label: 'Оплата' },
  { value: 'technical', label: 'Техподдержка' },
  { value: 'general', label: 'Общие вопросы' },
]

// Загрузка списка записей с фильтрами
async function fetchItems() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (categoryFilter.value !== 'all') {
      params.set('category', categoryFilter.value)
    }
    if (statusFilter.value !== 'all') {
      params.set('status', statusFilter.value)
    }
    if (searchQuery.value) {
      params.set('search', searchQuery.value)
    }

    const data = await $fetch<{ items: KnowledgeItem[] }>(`/api/admin/ai/knowledge?${params}`)
    items.value = data.items
  }
  catch {
    toast.error('Не удалось загрузить базу знаний')
  }
  finally {
    loading.value = false
  }
}

// Открытие модала создания новой записи
function openCreateModal() {
  editingItem.value = null
  formData.value = {
    category: '',
    question: '',
    answer: '',
    keywords: '',
    priority: 0,
    isActive: true,
  }
  showModal.value = true
}

// Открытие модала редактирования существующей записи
function openEditModal(item: KnowledgeItem) {
  editingItem.value = item
  formData.value = {
    category: item.category || '',
    question: item.question,
    answer: item.answer,
    keywords: item.keywords.join(', '),
    priority: item.priority,
    isActive: item.isActive,
  }
  showModal.value = true
}

// Сохранение записи (создание или обновление)
async function saveItem() {
  if (!formData.value.question.trim() || !formData.value.answer.trim()) {
    toast.error('Заполните вопрос и ответ')
    return
  }

  saving.value = true
  try {
    const body = {
      category: formData.value.category || null,
      question: formData.value.question.trim(),
      answer: formData.value.answer.trim(),
      keywords: formData.value.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k),
      priority: formData.value.priority,
      isActive: formData.value.isActive,
    }

    if (editingItem.value) {
      await $fetch(`/api/admin/ai/knowledge/${editingItem.value.id}`, {
        method: 'PUT',
        body,
      })
    }
    else {
      await $fetch('/api/admin/ai/knowledge', {
        method: 'POST',
        body,
      })
    }

    showModal.value = false
    await fetchItems()
    toast.success(editingItem.value ? 'Запись обновлена' : 'Запись создана')
  }
  catch {
    toast.error('Не удалось сохранить запись')
  }
  finally {
    saving.value = false
  }
}

// Удаление записи с подтверждением
async function deleteItem(item: KnowledgeItem) {
  if (!confirm(`Удалить запись "${item.question.slice(0, 50)}..."?`)) return

  try {
    await $fetch(`/api/admin/ai/knowledge/${item.id}`, {
      method: 'DELETE',
    })
    await fetchItems()
    toast.success('Запись удалена')
  }
  catch {
    toast.error('Не удалось удалить запись')
  }
}

// Переключение активности записи
async function toggleActive(item: KnowledgeItem) {
  try {
    await $fetch(`/api/admin/ai/knowledge/${item.id}`, {
      method: 'PUT',
      body: { isActive: !item.isActive },
    })
    await fetchItems()
    toast.success('Статус записи изменён')
  }
  catch {
    toast.error('Не удалось изменить статус записи')
  }
}

// Получение метки категории по значению
function getCategoryLabel(category: string | null) {
  const found = categories.find(c => c.value === category)
  return found?.label || category || 'Без категории'
}

// Получение CSS-классов цвета для badge категории
function getCategoryColor(category: string | null) {
  const colors: Record<string, string> = {
    internet: 'bg-blue-500/20 text-blue-400',
    tv: 'bg-purple-500/20 text-purple-400',
    billing: 'bg-green-500/20 text-green-400',
    technical: 'bg-orange-500/20 text-orange-400',
    general: 'bg-gray-500/20 text-gray-400',
  }
  return colors[category || ''] || 'bg-gray-500/20 text-gray-400'
}

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchItems()
  }, 300)
})

onMounted(() => {
  fetchItems()
})

watch([categoryFilter, statusFilter], () => {
  fetchItems()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <NuxtLink
            to="/settings/ai"
            class="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Icon name="heroicons:arrow-left" class="w-5 h-5" />
          </NuxtLink>
          <h1 class="text-3xl font-bold text-[var(--text-primary)]">
            База знаний AI
          </h1>
        </div>
        <p class="text-[var(--text-muted)]">
          Вопросы и ответы для RAG поиска
        </p>
      </div>
      <UiButton @click="openCreateModal">
        <Icon name="heroicons:plus" class="w-5 h-5" />
        Добавить запись
      </UiButton>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <!-- Search -->
      <div class="flex-1 min-w-[200px]">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по вопросам..."
          class="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary/50"
        />
      </div>

      <!-- Category Filter -->
      <select
        v-model="categoryFilter"
        class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)]"
      >
        <option value="all">Все категории</option>
        <option v-for="cat in categories" :key="cat.value" :value="cat.value">
          {{ cat.label }}
        </option>
      </select>

      <!-- Status Filter -->
      <select
        v-model="statusFilter"
        class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)]"
      >
        <option value="all">Все записи</option>
        <option value="active">Активные</option>
        <option value="inactive">Неактивные</option>
      </select>
    </div>

    <!-- Items List -->
    <div v-if="loading" class="text-center py-12">
      <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary mx-auto" />
    </div>

    <div v-else class="space-y-4">
      <UiCard
        v-for="item in items"
        :key="item.id"
        :class="{ 'opacity-50': !item.isActive }"
        class="hover:shadow-lg transition-shadow"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <UiBadge :class="getCategoryColor(item.category)">
                {{ getCategoryLabel(item.category) }}
              </UiBadge>
              <UiBadge v-if="!item.isActive" class="bg-red-500/20 text-red-400">
                Неактивно
              </UiBadge>
              <UiBadge v-if="item.priority > 0" class="bg-yellow-500/20 text-yellow-400">
                Приоритет: {{ item.priority }}
              </UiBadge>
            </div>

            <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {{ item.question }}
            </h3>

            <p class="text-sm text-[var(--text-muted)] line-clamp-2">
              {{ item.answer }}
            </p>

            <div v-if="item.keywords.length > 0" class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="kw in item.keywords.slice(0, 5)"
                :key="kw"
                class="px-2 py-0.5 text-xs rounded-full bg-white/5 text-[var(--text-muted)]"
              >
                {{ kw }}
              </span>
              <span
                v-if="item.keywords.length > 5"
                class="px-2 py-0.5 text-xs rounded-full bg-white/5 text-[var(--text-muted)]"
              >
                +{{ item.keywords.length - 5 }}
              </span>
            </div>
          </div>

          <div class="flex gap-2 flex-shrink-0">
            <UiButton
              :title="item.isActive ? 'Деактивировать' : 'Активировать'"
              variant="ghost"
              size="sm"
              @click="toggleActive(item)"
            >
              <Icon
                :name="item.isActive ? 'heroicons:eye' : 'heroicons:eye-slash'"
                class="w-4 h-4"
              />
            </UiButton>
            <UiButton
              variant="ghost"
              size="sm"
              title="Редактировать"
              @click="openEditModal(item)"
            >
              <Icon name="heroicons:pencil" class="w-4 h-4" />
            </UiButton>
            <UiButton
              variant="ghost"
              size="sm"
              title="Удалить"
              @click="deleteItem(item)"
            >
              <Icon name="heroicons:trash" class="w-4 h-4 text-red-400" />
            </UiButton>
          </div>
        </div>
      </UiCard>

      <!-- Empty state -->
      <div v-if="items.length === 0" class="text-center py-12">
        <Icon name="heroicons:book-open" class="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
        <p class="text-[var(--text-muted)]">
          {{ searchQuery ? 'Ничего не найдено' : 'База знаний пуста' }}
        </p>
        <UiButton class="mt-4" @click="openCreateModal">
          Добавить первую запись
        </UiButton>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <ClientOnly>
      <Teleport to="body">
        <div
          v-if="showModal"
          class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          @click.self="showModal = false"
        >
          <div class="w-full max-w-2xl glass-card rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-[var(--text-primary)]">
                {{ editingItem ? 'Редактировать запись' : 'Новая запись' }}
              </h2>
              <button
                class="p-2 rounded-lg hover:bg-white/10 transition-colors"
                @click="showModal = false"
              >
                <Icon name="heroicons:x-mark" class="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            <div class="space-y-4">
              <!-- Category -->
              <div>
                <label class="block text-sm text-[var(--text-muted)] mb-2">Категория</label>
                <select
                  v-model="formData.category"
                  class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)]"
                >
                  <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                    {{ cat.label }}
                  </option>
                </select>
              </div>

              <!-- Question -->
              <div>
                <label class="block text-sm text-[var(--text-muted)] mb-2">
                  Вопрос <span class="text-red-400">*</span>
                </label>
                <textarea
                  v-model="formData.question"
                  rows="2"
                  class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary/50 resize-none"
                  placeholder="Какой вопрос задаёт пользователь?"
                ></textarea>
              </div>

              <!-- Answer -->
              <div>
                <label class="block text-sm text-[var(--text-muted)] mb-2">
                  Ответ <span class="text-red-400">*</span>
                </label>
                <textarea
                  v-model="formData.answer"
                  rows="5"
                  class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary/50 resize-none"
                  placeholder="Как AI должен ответить?"
                ></textarea>
              </div>

              <!-- Keywords -->
              <div>
                <label class="block text-sm text-[var(--text-muted)] mb-2">
                  Ключевые слова (через запятую)
                </label>
                <input
                  v-model="formData.keywords"
                  type="text"
                  class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary/50"
                  placeholder="интернет, скорость, тариф"
                />
              </div>

              <!-- Priority & Active -->
              <div class="flex gap-4">
                <div class="flex-1">
                  <label class="block text-sm text-[var(--text-muted)] mb-2">
                    Приоритет (0-10)
                  </label>
                  <input
                    v-model.number="formData.priority"
                    type="number"
                    min="0"
                    max="10"
                    class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)] focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div class="flex-1 flex items-end">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      v-model="formData.isActive"
                      type="checkbox"
                      class="w-5 h-5 rounded"
                    />
                    <span class="text-[var(--text-primary)]">Активно</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 mt-6">
              <UiButton variant="ghost" @click="showModal = false">
                Отмена
              </UiButton>
              <UiButton :disabled="saving" @click="saveItem">
                <Icon v-if="saving" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
                {{ editingItem ? 'Сохранить' : 'Создать' }}
              </UiButton>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>
