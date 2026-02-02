<script setup lang="ts">
interface AISettings {
  id: string
  isEnabled: boolean
  operatorName: string
  systemPrompt: string
  model: string
  maxTokens: number
  escalationKeywords: string[]
  maxBotMessages: number
  ragEnabled: boolean
  ragMatchThreshold: number
  ragMatchCount: number
  updatedAt: string
}

interface AIStats {
  period: string
  messages: { total: number, avgPerDay: number }
  tokens: { prompt: number, completion: number, total: number }
  latency: { average: number, unit: string }
  cost: { estimated: number, currency: string }
  escalations: { total: number, rate: number, reasons: Record<string, number> }
  chats: { withBot: number }
  knowledge: { activeItems: number }
  models: Record<string, number>
}

definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Настройки AI-бота — Админ-панель' })

const toast = useToast()

const loading = ref(false)
const saving = ref(false)
const settings = ref<AISettings | null>(null)
const stats = ref<AIStats | null>(null)
const statsPeriod = ref('week')

const editedPrompt = ref('')
const editedKeywords = ref('')
const editedOperatorName = ref('')

const models = [
  { value: 'gpt-5-nano', label: 'GPT-5 Nano (быстрый, дешёвый)' },
  { value: 'gpt-5-mini', label: 'GPT-5 Mini (баланс цена/качество)' },
  { value: 'gpt-5', label: 'GPT-5 (максимальное качество)' },
]

const statsPeriodOptions = [
  { value: 'today', label: 'Сегодня' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'all', label: 'Всё время' },
]

async function fetchSettings() {
  loading.value = true
  try {
    const data = await $fetch<{ settings: AISettings }>('/api/admin/ai/settings')
    settings.value = data.settings
    editedPrompt.value = data.settings.systemPrompt
    editedKeywords.value = data.settings.escalationKeywords.join('\n')
    editedOperatorName.value = data.settings.operatorName || ''
  }
  catch {
    toast.error('Не удалось загрузить настройки AI')
  }
  finally {
    loading.value = false
  }
}

async function fetchStats() {
  try {
    const data = await $fetch<{ stats: AIStats }>(`/api/admin/ai/stats?period=${statsPeriod.value}`)
    stats.value = data.stats
  }
  catch {
    toast.error('Не удалось загрузить статистику AI')
  }
}

async function updateSettings(updates: Partial<AISettings>) {
  saving.value = true
  try {
    const data = await $fetch<{ settings: AISettings }>('/api/admin/ai/settings', {
      method: 'PUT',
      body: updates,
    })
    settings.value = data.settings
    editedPrompt.value = data.settings.systemPrompt
    editedKeywords.value = data.settings.escalationKeywords.join('\n')
    toast.success('Настройки сохранены')
  }
  catch {
    toast.error('Не удалось сохранить настройки')
  }
  finally {
    saving.value = false
  }
}

async function toggleEnabled() {
  if (!settings.value) return
  await updateSettings({ isEnabled: !settings.value.isEnabled })
}

async function savePrompt() {
  await updateSettings({ systemPrompt: editedPrompt.value })
}

async function saveOperatorName() {
  await updateSettings({ operatorName: editedOperatorName.value })
}

async function saveKeywords() {
  const keywords = editedKeywords.value
    .split('\n')
    .map(k => k.trim())
    .filter(k => k)
  await updateSettings({ escalationKeywords: keywords })
}

async function saveModel(model: string) {
  await updateSettings({ model })
}

async function saveMaxTokens(tokens: number) {
  await updateSettings({ maxTokens: tokens })
}

async function saveMaxBotMessages(count: number) {
  await updateSettings({ maxBotMessages: count })
}

async function toggleRag() {
  if (!settings.value) return
  await updateSettings({ ragEnabled: !settings.value.ragEnabled })
}

async function saveRagThreshold(threshold: number) {
  await updateSettings({ ragMatchThreshold: threshold })
}

async function saveRagCount(count: number) {
  await updateSettings({ ragMatchCount: count })
}

function formatNumber(n: number) {
  return n.toLocaleString('ru-RU')
}

onMounted(() => {
  fetchSettings()
  fetchStats()
})

watch(statsPeriod, () => {
  fetchStats()
})
</script>

<template>
  <div class="ai-settings-page">
    <header class="ai-settings-page__hero">
      <div class="ai-settings-page__hero-bg" aria-hidden="true" />
      <div class="ai-settings-page__hero-inner">
        <div class="flex items-center gap-3 mb-2">
          <div class="ai-settings-page__hero-icon">
            <Icon name="heroicons:sparkles" class="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 class="ai-settings-page__hero-title">Настройки AI-бота</h1>
            <p class="ai-settings-page__hero-subtitle">
              Управление AI-ассистентом для чата поддержки
            </p>
          </div>
        </div>
        <NuxtLink to="/settings/ai/knowledge" class="ai-settings-page__btn-knowledge">
          <Icon name="heroicons:book-open" class="w-5 h-5" />
          <span>База знаний</span>
        </NuxtLink>
      </div>
    </header>

    <UiLoading v-if="loading" class="ai-settings-page__loading" />

    <div v-else-if="settings" class="ai-settings-page__layout">
      <div class="ai-settings-page__main">
        <!-- Статус бота -->
        <section class="ai-settings-page__card glass-card glass-card-static">
          <div class="ai-settings-page__card-head-row">
            <div>
              <h2 class="ai-settings-page__card-title">Статус бота</h2>
              <p class="ai-settings-page__card-desc">
                {{ settings.isEnabled ? 'Бот активен и отвечает на сообщения' : 'Бот отключён' }}
              </p>
            </div>
            <UiToggle
              :model-value="settings.isEnabled"
              :disabled="saving"
              @update:model-value="toggleEnabled"
            />
          </div>
          <div class="ai-settings-page__card-divider" />
          <div class="ai-settings-page__field">
            <label class="ai-settings-page__label">Имя оператора (для маскировки бота)</label>
            <div class="ai-settings-page__field-row">
              <UiInput
                v-model="editedOperatorName"
                placeholder="Анна"
                class="ai-settings-page__input-flex"
              />
              <UiButton
                :disabled="saving || editedOperatorName === settings.operatorName"
                size="sm"
                @click="saveOperatorName"
              >
                Сохранить
              </UiButton>
            </div>
            <p class="ai-settings-page__hint">Бот будет представляться этим именем в чате</p>
          </div>
        </section>

        <!-- Системный промпт -->
        <section class="ai-settings-page__card glass-card glass-card-static">
          <h2 class="ai-settings-page__card-title">Системный промпт</h2>
          <textarea
            v-model="editedPrompt"
            rows="10"
            placeholder="Инструкции для AI-бота..."
            class="ai-settings-page__textarea"
          />
          <div class="ai-settings-page__card-actions">
            <UiButton
              :disabled="saving || editedPrompt === settings.systemPrompt"
              :loading="saving"
              @click="savePrompt"
            >
              Сохранить промпт
            </UiButton>
          </div>
        </section>

        <!-- Модель и параметры -->
        <section class="ai-settings-page__card glass-card glass-card-static">
          <h2 class="ai-settings-page__card-title">Модель и параметры</h2>
          <div class="ai-settings-page__grid-2">
            <UiSelect
              :model-value="settings.model"
              :options="models"
              :disabled="saving"
              label="Модель OpenAI"
              @update:model-value="saveModel($event as string)"
            />
            <div class="ai-settings-page__field">
              <label class="ai-settings-page__label">Макс. токенов (100–2000)</label>
              <UiInput
                :model-value="settings.maxTokens"
                type="number"
                :min="100"
                :max="2000"
                :step="100"
                @change="saveMaxTokens(Number(($event.target as HTMLInputElement).value))"
              />
            </div>
            <div class="ai-settings-page__field">
              <label class="ai-settings-page__label">Макс. сообщений до эскалации</label>
              <UiInput
                :model-value="settings.maxBotMessages"
                type="number"
                :min="1"
                @change="saveMaxBotMessages(Number(($event.target as HTMLInputElement).value))"
              />
            </div>
          </div>
        </section>

        <!-- Ключевые слова для эскалации -->
        <section class="ai-settings-page__card glass-card glass-card-static">
          <h2 class="ai-settings-page__card-title">Ключевые слова для эскалации</h2>
          <p class="ai-settings-page__card-desc ai-settings-page__card-desc--mb">
            Если сообщение содержит эти слова, чат будет передан оператору
          </p>
          <textarea
            v-model="editedKeywords"
            rows="5"
            placeholder="Одно слово или фраза на строку..."
            class="ai-settings-page__textarea"
          />
          <div class="ai-settings-page__card-actions">
            <UiButton
              :disabled="saving || editedKeywords === settings.escalationKeywords.join('\n')"
              @click="saveKeywords"
            >
              Сохранить
            </UiButton>
          </div>
        </section>

        <!-- RAG -->
        <section class="ai-settings-page__card glass-card glass-card-static">
          <div class="ai-settings-page__card-head-row">
            <div>
              <h2 class="ai-settings-page__card-title">RAG (база знаний)</h2>
              <p class="ai-settings-page__card-desc">Использовать базу знаний для ответов</p>
            </div>
            <UiToggle
              :model-value="settings.ragEnabled"
              :disabled="saving"
              @update:model-value="toggleRag"
            />
          </div>
          <div v-if="settings.ragEnabled" class="ai-settings-page__rag-fields">
            <div class="ai-settings-page__field">
              <label class="ai-settings-page__label">Порог релевантности (0.5–0.95)</label>
              <UiInput
                :model-value="settings.ragMatchThreshold"
                type="number"
                :min="0.5"
                :max="0.95"
                :step="0.05"
                @change="saveRagThreshold(Number(($event.target as HTMLInputElement).value))"
              />
            </div>
            <div class="ai-settings-page__field">
              <label class="ai-settings-page__label">Кол-во результатов (1–10)</label>
              <UiInput
                :model-value="settings.ragMatchCount"
                type="number"
                :min="1"
                :max="10"
                :step="1"
                @change="saveRagCount(Number(($event.target as HTMLInputElement).value))"
              />
            </div>
          </div>
        </section>
      </div>

      <aside class="ai-settings-page__sidebar">
        <!-- Статистика -->
        <section class="ai-settings-page__card glass-card glass-card-static">
          <div class="ai-settings-page__card-head-row">
            <h2 class="ai-settings-page__card-title">Статистика</h2>
            <UiSelect
              v-model="statsPeriod"
              :options="statsPeriodOptions"
              :placeholder="''"
              size="sm"
              class="ai-settings-page__period-select"
            />
          </div>
          <div v-if="stats" class="ai-settings-page__stats-list">
            <div class="ai-settings-page__stat-row">
              <span class="ai-settings-page__stat-label">Сообщений бота</span>
              <span class="ai-settings-page__stat-value">{{ formatNumber(stats.messages.total) }}</span>
            </div>
            <div class="ai-settings-page__stat-row">
              <span class="ai-settings-page__stat-label">Токенов использовано</span>
              <span class="ai-settings-page__stat-value">{{ formatNumber(stats.tokens.total) }}</span>
            </div>
            <div class="ai-settings-page__stat-row">
              <span class="ai-settings-page__stat-label">Средняя задержка</span>
              <span class="ai-settings-page__stat-value">{{ stats.latency.average }} мс</span>
            </div>
            <div class="ai-settings-page__stat-row">
              <span class="ai-settings-page__stat-label">Стоимость</span>
              <span class="ai-settings-page__stat-value">~${{ stats.cost.estimated.toFixed(2) }}</span>
            </div>
            <hr class="ai-settings-page__stat-hr">
            <div class="ai-settings-page__stat-row">
              <span class="ai-settings-page__stat-label">Эскалаций</span>
              <span class="ai-settings-page__stat-value">{{ stats.escalations.total }} ({{ stats.escalations.rate }}%)</span>
            </div>
            <div class="ai-settings-page__stat-row">
              <span class="ai-settings-page__stat-label">Чатов с ботом</span>
              <span class="ai-settings-page__stat-value">{{ stats.chats.withBot }}</span>
            </div>
            <div class="ai-settings-page__stat-row">
              <span class="ai-settings-page__stat-label">Записей в базе</span>
              <span class="ai-settings-page__stat-value">{{ stats.knowledge.activeItems }}</span>
            </div>
          </div>
        </section>

        <!-- Быстрые ссылки -->
        <section class="ai-settings-page__card glass-card glass-card-static">
          <h2 class="ai-settings-page__card-title">Быстрые ссылки</h2>
          <div class="ai-settings-page__links">
            <NuxtLink to="/settings/ai/knowledge" class="ai-settings-page__link-item">
              <Icon name="heroicons:book-open" class="ai-settings-page__link-icon" />
              <span>База знаний FAQ</span>
            </NuxtLink>
            <NuxtLink to="/chat" class="ai-settings-page__link-item">
              <Icon name="heroicons:chat-bubble-left-right" class="ai-settings-page__link-icon" />
              <span>Чаты поддержки</span>
            </NuxtLink>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>
