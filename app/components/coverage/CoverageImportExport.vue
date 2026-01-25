<script setup lang="ts">
interface Partner {
  id: string
  name: string
  color: string
}

interface Props {
  loading?: boolean
  partners?: Partner[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  partners: () => [],
})

const emit = defineEmits<{
  import: [data: { geojson: any, type: string, partnerId?: string, replaceExisting: boolean }]
  export: [query: string]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const replaceExisting = ref(false)
const importing = ref(false)
const error = ref('')

// Импорт: выбор владельца зоны (pg19 или конкретный партнёр)
const importOwner = ref<string>('pg19')

// Опции для импорта: ПЖ19 + все партнёры
const importOwnerOptions = computed(() => [
  { value: 'pg19', label: 'ПЖ19' },
  ...props.partners.map(p => ({ value: p.id, label: p.name })),
])

// Экспорт: выбор партнёра (все или конкретный)
const exportPartnerId = ref<string>('all')

// Опции для экспорта: Все + все партнёры
const exportPartnerOptions = computed(() => [
  { value: 'all', label: 'Все зоны' },
  ...props.partners.map(p => ({ value: p.id, label: p.name })),
])

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  if (!file.name.endsWith('.geojson') && !file.name.endsWith('.json')) {
    error.value = 'Поддерживаются только .geojson и .json файлы'
    return
  }

  importing.value = true
  error.value = ''

  try {
    const text = await file.text()
    const geojson = JSON.parse(text)

    // Validate GeoJSON
    if (!geojson.type) {
      throw new Error('Невалидный GeoJSON: отсутствует type')
    }

    // Определяем тип и partnerId по выбранному владельцу
    const isPg19 = importOwner.value === 'pg19'

    emit('import', {
      geojson,
      type: isPg19 ? 'pg19' : 'partner',
      partnerId: isPg19 ? undefined : importOwner.value,
      replaceExisting: replaceExisting.value,
    })
  }
  catch (err: any) {
    error.value = err.message || 'Ошибка при чтении файла'
  }
  finally {
    importing.value = false
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const handleExport = () => {
  const params = new URLSearchParams()
  if (exportPartnerId.value !== 'all') {
    params.set('partnerId', exportPartnerId.value)
  }
  emit('export', params.toString())
}

const clearError = () => {
  error.value = ''
}
</script>

<template>
  <UiCard>
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-[var(--text-primary)]">
        Импорт / Экспорт
      </h3>

      <!-- Error message -->
      <div
        v-if="error"
        class="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center justify-between"
      >
        <span>{{ error }}</span>
        <button class="ml-2 hover:text-red-300" @click="clearError">
          <Icon name="heroicons:x-mark" class="w-4 h-4" />
        </button>
      </div>

      <!-- Import section -->
      <div class="space-y-3">
        <label class="block text-sm font-medium text-[var(--text-secondary)]">
          Импорт GeoJSON
        </label>

        <div class="space-y-3">
          <UiSelect
            v-model="importOwner"
            :options="importOwnerOptions"
            :placeholder="undefined"
            size="sm"
          />

          <label class="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
            <input
              v-model="replaceExisting"
              type="checkbox"
              class="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-primary focus:ring-primary"
            />
            Заменить существующие
          </label>
        </div>

        <input
          ref="fileInput"
          type="file"
          accept=".geojson,.json"
          class="hidden"
          @change="handleFileSelect"
        />

        <UiButton
          :loading="importing"
          :disabled="loading || importing"
          variant="secondary"
          class="w-full"
          @click="triggerFileInput"
        >
          <Icon name="heroicons:arrow-up-tray" class="w-4 h-4" />
          Загрузить GeoJSON
        </UiButton>

        <p class="text-xs text-[var(--text-muted)]">
          Поддерживаются форматы: FeatureCollection, Feature, Polygon
        </p>
      </div>

      <hr class="border-[var(--glass-border)]" />

      <!-- Export section -->
      <div class="space-y-3">
        <label class="block text-sm font-medium text-[var(--text-secondary)]">
          Экспорт зон
        </label>

        <UiSelect
          v-model="exportPartnerId"
          :options="exportPartnerOptions"
          :placeholder="undefined"
          size="sm"
        />

        <UiButton
          :disabled="loading"
          variant="ghost"
          class="w-full"
          @click="handleExport"
        >
          <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
          Скачать GeoJSON
        </UiButton>
      </div>
    </div>
  </UiCard>
</template>
