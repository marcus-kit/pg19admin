<script setup lang="ts">
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

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'База знаний AI — Админ-панель' })

const toast = useToast()

const loading = ref(false)
const saving = ref(false)
const items = ref<KnowledgeItem[]>([])
const categoryFilter = ref('all')
const statusFilter = ref('active')
const searchQuery = ref('')

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

const categories = [
  { value: '', label: 'Без категории' },
  { value: 'internet', label: 'Интернет' },
  { value: 'tv', label: 'Телевидение' },
  { value: 'billing', label: 'Оплата' },
  { value: 'technical', label: 'Техподдержка' },
  { value: 'general', label: 'Общие вопросы' },
]

const categoryOptions = [
  { value: 'all', label: 'Все категории' },
  ...categories.map(c => ({ value: c.value, label: c.label })),
]

const statusOptions = [
  { value: 'all', label: 'Все записи' },
  { value: 'active', label: 'Активные' },
  { value: 'inactive', label: 'Неактивные' },
]

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

function getCategoryLabel(category: string | null) {
  const found = categories.find(c => c.value === category)
  return found?.label || category || 'Без категории'
}

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
  <div class="ai-knowledge-page">
    <header class="ai-knowledge-page__hero">
      <div class="ai-knowledge-page__hero-bg" aria-hidden="true" />
      <div class="ai-knowledge-page__hero-inner">
        <NuxtLink to="/settings/ai" class="ai-knowledge-page__back" aria-label="Назад">
          <Icon name="heroicons:arrow-left" class="w-5 h-5" />
        </NuxtLink>
        <div class="flex items-center gap-3 mb-2">
          <div class="ai-knowledge-page__hero-icon">
            <Icon name="heroicons:book-open" class="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 class="ai-knowledge-page__hero-title">База знаний AI</h1>
            <p class="ai-knowledge-page__hero-subtitle">
              Вопросы и ответы для RAG поиска
            </p>
          </div>
        </div>
        <div v-if="!loading" class="ai-knowledge-page__stats">
          <span class="ai-knowledge-page__stat"><strong>{{ items.length }}</strong> записей</span>
        </div>
        <button type="button" class="ai-knowledge-page__btn-add" @click="openCreateModal">
          <Icon name="heroicons:plus" class="w-5 h-5" />
          <span>Добавить запись</span>
        </button>
      </div>
    </header>

    <div class="ai-knowledge-page__toolbar">
      <div class="ai-knowledge-page__bar-row">
        <div class="ai-knowledge-page__block ai-knowledge-page__block--search">
          <Icon name="heroicons:magnifying-glass" class="ai-knowledge-page__search-icon" aria-hidden="true" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Поиск по вопросам..."
            class="ai-knowledge-page__search-input"
            aria-label="Поиск в базе знаний"
          />
        </div>
        <UiSelect
          v-model="categoryFilter"
          :options="categoryOptions"
          size="md"
          class="ai-knowledge-page__select"
        />
        <UiSelect
          v-model="statusFilter"
          :options="statusOptions"
          size="md"
          class="ai-knowledge-page__select"
        />
      </div>
    </div>

    <UiLoading v-if="loading" class="ai-knowledge-page__loading" />

    <div v-else class="ai-knowledge-page__list">
      <article
        v-for="item in items"
        :key="item.id"
        class="ai-knowledge-page__card glass-card glass-card-static"
        :class="{ 'ai-knowledge-page__card--inactive': !item.isActive }"
      >
        <div class="ai-knowledge-page__card-body">
          <div class="ai-knowledge-page__card-badges">
            <UiBadge :class="getCategoryColor(item.category)" size="sm">
              {{ getCategoryLabel(item.category) }}
            </UiBadge>
            <UiBadge v-if="!item.isActive" class="bg-red-500/20 text-red-400" size="sm">
              Неактивно
            </UiBadge>
            <UiBadge v-if="item.priority > 0" class="bg-yellow-500/20 text-yellow-400" size="sm">
              Приоритет: {{ item.priority }}
            </UiBadge>
          </div>
          <h2 class="ai-knowledge-page__card-question">{{ item.question }}</h2>
          <p class="ai-knowledge-page__card-answer">{{ item.answer }}</p>
          <div v-if="item.keywords.length > 0" class="ai-knowledge-page__card-keywords">
            <span
              v-for="kw in item.keywords.slice(0, 5)"
              :key="kw"
              class="ai-knowledge-page__keyword"
            >
              {{ kw }}
            </span>
            <span v-if="item.keywords.length > 5" class="ai-knowledge-page__keyword">
              +{{ item.keywords.length - 5 }}
            </span>
          </div>
        </div>
        <div class="ai-knowledge-page__card-actions">
          <button
            type="button"
            class="ai-knowledge-page__card-action"
            :title="item.isActive ? 'Деактивировать' : 'Активировать'"
            @click="toggleActive(item)"
          >
            <Icon :name="item.isActive ? 'heroicons:eye' : 'heroicons:eye-slash'" class="w-4 h-4" />
          </button>
          <button
            type="button"
            class="ai-knowledge-page__card-action"
            title="Редактировать"
            @click="openEditModal(item)"
          >
            <Icon name="heroicons:pencil" class="w-4 h-4" />
          </button>
          <button
            type="button"
            class="ai-knowledge-page__card-action ai-knowledge-page__card-action--danger"
            title="Удалить"
            @click="deleteItem(item)"
          >
            <Icon name="heroicons:trash" class="w-4 h-4" />
          </button>
        </div>
      </article>

      <div v-if="items.length === 0" class="ai-knowledge-page__empty">
        <Icon name="heroicons:book-open" class="ai-knowledge-page__empty-icon" />
        <h2 class="ai-knowledge-page__empty-title">
          {{ searchQuery ? 'Ничего не найдено' : 'База знаний пуста' }}
        </h2>
        <p class="ai-knowledge-page__empty-text">
          {{ searchQuery ? 'Попробуйте другой запрос или сбросьте фильтры' : 'Добавьте первую запись для RAG' }}
        </p>
        <button type="button" class="ai-knowledge-page__btn-add-empty" @click="openCreateModal">
          Добавить первую запись
        </button>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <ClientOnly>
      <Teleport to="body">
        <div
          v-if="showModal"
          class="ai-knowledge-page__modal-backdrop"
          aria-hidden="true"
          @click.self="showModal = false"
        >
          <div class="ai-knowledge-page__modal glass-card glass-card-static">
            <div class="ai-knowledge-page__modal-head">
              <h2 class="ai-knowledge-page__modal-title">
                {{ editingItem ? 'Редактировать запись' : 'Новая запись' }}
              </h2>
              <button
                type="button"
                class="ai-knowledge-page__modal-close"
                aria-label="Закрыть"
                @click="showModal = false"
              >
                <Icon name="heroicons:x-mark" class="w-5 h-5" />
              </button>
            </div>

            <div class="ai-knowledge-page__modal-body">
              <div class="ai-knowledge-page__field">
                <label class="ai-knowledge-page__label">Категория</label>
                <select
                  v-model="formData.category"
                  class="ai-knowledge-page__select-full"
                >
                  <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                    {{ cat.label }}
                  </option>
                </select>
              </div>
              <div class="ai-knowledge-page__field">
                <label class="ai-knowledge-page__label">Вопрос <span class="ai-knowledge-page__required">*</span></label>
                <textarea
                  v-model="formData.question"
                  rows="2"
                  placeholder="Какой вопрос задаёт пользователь?"
                  class="ai-knowledge-page__textarea"
                />
              </div>
              <div class="ai-knowledge-page__field">
                <label class="ai-knowledge-page__label">Ответ <span class="ai-knowledge-page__required">*</span></label>
                <textarea
                  v-model="formData.answer"
                  rows="5"
                  placeholder="Как AI должен ответить?"
                  class="ai-knowledge-page__textarea"
                />
              </div>
              <div class="ai-knowledge-page__field">
                <label class="ai-knowledge-page__label">Ключевые слова (через запятую)</label>
                <input
                  v-model="formData.keywords"
                  type="text"
                  placeholder="интернет, скорость, тариф"
                  class="ai-knowledge-page__input"
                />
              </div>
              <div class="ai-knowledge-page__field-row">
                <div class="ai-knowledge-page__field">
                  <label class="ai-knowledge-page__label">Приоритет (0–10)</label>
                  <input
                    v-model.number="formData.priority"
                    type="number"
                    min="0"
                    max="10"
                    class="ai-knowledge-page__input"
                  />
                </div>
                <label class="ai-knowledge-page__checkbox-wrap">
                  <input v-model="formData.isActive" type="checkbox" class="ai-knowledge-page__checkbox">
                  <span class="ai-knowledge-page__checkbox-label">Активно</span>
                </label>
              </div>
            </div>

            <div class="ai-knowledge-page__modal-actions">
              <UiButton variant="secondary" @click="showModal = false">
                Отмена
              </UiButton>
              <UiButton :disabled="saving" :loading="saving" @click="saveItem">
                {{ editingItem ? 'Сохранить' : 'Создать' }}
              </UiButton>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>
