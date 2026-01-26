<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Настройки AI-бота — Админ-панель' })

const toast = useToast()

// Интерфейс настроек AI-бота
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

// Интерфейс статистики AI
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

// Состояние страницы
const loading = ref(false)
const saving = ref(false)
const settings = ref<AISettings | null>(null)
const stats = ref<AIStats | null>(null)
const statsPeriod = ref('week')

// Локальные копии для редактирования
const editedPrompt = ref('')
const editedKeywords = ref('')
const editedOperatorName = ref('')

// Доступные модели OpenAI
const models = [
  { value: 'gpt-5-nano', label: 'GPT-5 Nano (быстрый, дешёвый)' },
  { value: 'gpt-5-mini', label: 'GPT-5 Mini (баланс цена/качество)' },
  { value: 'gpt-5', label: 'GPT-5 (максимальное качество)' },
]

// Опции периода для статистики
const statsPeriodOptions = [
  { value: 'today', label: 'Сегодня' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'all', label: 'Всё время' },
]

// Загрузка настроек AI
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

// Загрузка статистики AI за выбранный период
async function fetchStats() {
  try {
    const data = await $fetch<{ stats: AIStats }>(`/api/admin/ai/stats?period=${statsPeriod.value}`)
    stats.value = data.stats
  }
  catch {
    toast.error('Не удалось загрузить статистику AI')
  }
}

// Обновление настроек AI (частичное)
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

// Форматирование числа с разделителями тысяч
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
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold text-[var(--text-primary)]">
          Настройки AI-бота
        </h1>
        <p class="text-[var(--text-muted)] mt-1">
          Управление AI-ассистентом для чата поддержки
        </p>
      </div>
      <UiButton @click="$router.push('/settings/ai/knowledge')">
        <Icon name="heroicons:book-open" class="w-5 h-5" />
        База знаний
      </UiButton>
    </div>

    <div v-if="loading" class="text-center py-12">
      <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-primary mx-auto" />
    </div>

    <div v-else-if="settings" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Settings -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Enable/Disable + Operator Name -->
        <UiCard>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-semibold text-[var(--text-primary)]">Статус бота</h3>
              <p class="text-sm text-[var(--text-muted)]">
                {{ settings.isEnabled ? 'Бот активен и отвечает на сообщения' : 'Бот отключён' }}
              </p>
            </div>
            <UiToggle
              :model-value="settings.isEnabled"
              :disabled="saving"
              @update:model-value="toggleEnabled"
            />
          </div>
          <div class="pt-4 border-t border-white/10">
            <label class="block text-sm text-[var(--text-muted)] mb-2">
              Имя оператора (для маскировки бота)
            </label>
            <div class="flex gap-2">
              <UiInput
                v-model="editedOperatorName"
                placeholder="Анна"
                class="flex-1"
              />
              <UiButton
                :disabled="saving || editedOperatorName === settings.operatorName"
                size="sm"
                @click="saveOperatorName"
              >
                Сохранить
              </UiButton>
            </div>
            <p class="text-xs text-[var(--text-muted)] mt-2">
              Бот будет представляться этим именем в чате
            </p>
          </div>
        </UiCard>

        <!-- System Prompt -->
        <UiCard>
          <h3 class="font-semibold text-[var(--text-primary)] mb-4">Системный промпт</h3>
          <textarea
            v-model="editedPrompt"
            rows="10"
            class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none font-mono text-sm"
            placeholder="Инструкции для AI-бота..."
          ></textarea>
          <div class="flex justify-end mt-3">
            <UiButton
              :disabled="saving || editedPrompt === settings.systemPrompt"
              @click="savePrompt"
            >
              <Icon v-if="saving" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
              Сохранить промпт
            </UiButton>
          </div>
        </UiCard>

        <!-- Model & Parameters -->
        <UiCard>
          <h3 class="font-semibold text-[var(--text-primary)] mb-4">Модель и параметры</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Model -->
            <UiSelect
              :model-value="settings.model"
              :options="models"
              :disabled="saving"
              label="Модель OpenAI"
              @update:model-value="saveModel($event as string)"
            />

            <!-- Max Tokens -->
            <div>
              <label class="block text-sm text-[var(--text-muted)] mb-2">
                Макс. токенов (100–2000)
              </label>
              <UiInput
                :model-value="settings.maxTokens"
                :min="100"
                :max="2000"
                :step="100"
                type="number"
                @change="saveMaxTokens(Number(($event.target as HTMLInputElement).value))"
              />
            </div>

            <!-- Max Bot Messages -->
            <div>
              <label class="block text-sm text-[var(--text-muted)] mb-2">
                Макс. сообщений до эскалации
              </label>
              <UiInput
                :model-value="settings.maxBotMessages"
                :min="1"
                type="number"
                @change="saveMaxBotMessages(Number(($event.target as HTMLInputElement).value))"
              />
            </div>
          </div>
        </UiCard>

        <!-- Escalation Keywords -->
        <UiCard>
          <h3 class="font-semibold text-[var(--text-primary)] mb-2">Ключевые слова для эскалации</h3>
          <p class="text-sm text-[var(--text-muted)] mb-4">
            Если сообщение содержит эти слова, чат будет передан оператору
          </p>
          <textarea
            v-model="editedKeywords"
            rows="5"
            class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm"
            placeholder="Одно слово или фраза на строку..."
          ></textarea>
          <div class="flex justify-end mt-3">
            <UiButton
              :disabled="saving || editedKeywords === settings.escalationKeywords.join('\n')"
              @click="saveKeywords"
            >
              Сохранить
            </UiButton>
          </div>
        </UiCard>

        <!-- RAG Settings -->
        <UiCard>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-semibold text-[var(--text-primary)]">RAG (база знаний)</h3>
              <p class="text-sm text-[var(--text-muted)]">
                Использовать базу знаний для ответов
              </p>
            </div>
            <UiToggle
              :model-value="settings.ragEnabled"
              :disabled="saving"
              @update:model-value="toggleRag"
            />
          </div>

          <div v-if="settings.ragEnabled" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <label class="block text-sm text-[var(--text-muted)] mb-2">
                Порог релевантности (0.5–0.95)
              </label>
              <UiInput
                :model-value="settings.ragMatchThreshold"
                :min="0.5"
                :max="0.95"
                :step="0.05"
                type="number"
                @change="saveRagThreshold(Number(($event.target as HTMLInputElement).value))"
              />
            </div>

            <div>
              <label class="block text-sm text-[var(--text-muted)] mb-2">
                Кол-во результатов (1–10)
              </label>
              <UiInput
                :model-value="settings.ragMatchCount"
                :min="1"
                :max="10"
                :step="1"
                type="number"
                @change="saveRagCount(Number(($event.target as HTMLInputElement).value))"
              />
            </div>
          </div>
        </UiCard>
      </div>

      <!-- Stats Sidebar -->
      <div class="space-y-6">
        <UiCard>
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-[var(--text-primary)]">Статистика</h3>
            <div class="w-32">
              <UiSelect
                v-model="statsPeriod"
                :options="statsPeriodOptions"
                :placeholder="''"
                size="sm"
              />
            </div>
          </div>

          <div v-if="stats" class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-sm text-[var(--text-muted)]">Сообщений бота</span>
              <span class="font-semibold text-[var(--text-primary)]">
                {{ formatNumber(stats.messages.total) }}
              </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-sm text-[var(--text-muted)]">Токенов использовано</span>
              <span class="font-semibold text-[var(--text-primary)]">
                {{ formatNumber(stats.tokens.total) }}
              </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-sm text-[var(--text-muted)]">Средняя задержка</span>
              <span class="font-semibold text-[var(--text-primary)]">
                {{ stats.latency.average }} мс
              </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-sm text-[var(--text-muted)]">Стоимость</span>
              <span class="font-semibold text-[var(--text-primary)]">
                ~${{ stats.cost.estimated.toFixed(2) }}
              </span>
            </div>

            <hr class="border-white/10" />

            <div class="flex justify-between items-center">
              <span class="text-sm text-[var(--text-muted)]">Эскалаций</span>
              <span class="font-semibold text-[var(--text-primary)]">
                {{ stats.escalations.total }} ({{ stats.escalations.rate }}%)
              </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-sm text-[var(--text-muted)]">Чатов с ботом</span>
              <span class="font-semibold text-[var(--text-primary)]">
                {{ stats.chats.withBot }}
              </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-sm text-[var(--text-muted)]">Записей в базе</span>
              <span class="font-semibold text-[var(--text-primary)]">
                {{ stats.knowledge.activeItems }}
              </span>
            </div>
          </div>
        </UiCard>

        <!-- Quick Links -->
        <UiCard>
          <h3 class="font-semibold text-[var(--text-primary)] mb-4">Быстрые ссылки</h3>
          <div class="space-y-2">
            <NuxtLink
              to="/settings/ai/knowledge"
              class="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Icon name="heroicons:book-open" class="w-5 h-5 text-primary" />
              <span class="text-[var(--text-primary)]">База знаний FAQ</span>
            </NuxtLink>
            <NuxtLink
              to="/chat"
              class="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Icon name="heroicons:chat-bubble-left-right" class="w-5 h-5 text-primary" />
              <span class="text-[var(--text-primary)]">Чаты поддержки</span>
            </NuxtLink>
          </div>
        </UiCard>
      </div>
    </div>
  </div>
</template>
