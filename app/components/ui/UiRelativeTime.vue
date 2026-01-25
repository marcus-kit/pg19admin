<script setup lang="ts">
/**
 * UiRelativeTime — отображение относительного времени ("5 мин. назад", "вчера")
 *
 * Особенности:
 * - Client-only рендеринг — предотвращает hydration mismatch (сервер и клиент
 *   могут показать разное время)
 * - Автообновление каждую минуту — для актуальности "X мин. назад"
 * - Реактивность на изменение props.date
 */

interface Props {
  date: string | null | undefined // ISO дата или null
  fallback?: string // Fallback при отсутствии даты
}

const props = withDefaults(defineProps<Props>(), {
  fallback: '—',
})

const { formatRelativeDate } = useFormatters()

// =============================================================================
// STATE
// =============================================================================

const displayValue = ref(props.fallback) // Текст для отображения
const mounted = ref(false) // Флаг клиентского рендера
let interval: ReturnType<typeof setInterval> | null = null

// =============================================================================
// LIFECYCLE
// =============================================================================

onMounted(() => {
  mounted.value = true

  // Первичное вычисление относительного времени
  if (props.date) {
    displayValue.value = formatRelativeDate(props.date)
  }

  // Автообновление каждую минуту (60000 мс)
  interval = setInterval(() => {
    if (props.date) {
      displayValue.value = formatRelativeDate(props.date)
    }
  }, 60000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

// =============================================================================
// WATCHERS
// =============================================================================

// Реакция на изменение даты извне
watch(() => props.date, (newDate) => {
  if (mounted.value && newDate) {
    displayValue.value = formatRelativeDate(newDate)
  }
  else if (!newDate) {
    displayValue.value = props.fallback
  }
})
</script>

<template>
  <span>{{ displayValue }}</span>
</template>
