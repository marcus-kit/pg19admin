<script setup lang="ts">
/**
 * UiToggle — переключатель (switch)
 *
 * Особенности:
 * - v-model для boolean значения
 * - Три размера: sm, md, lg
 * - Опциональные label и description справа
 * - Доступность: role="switch", aria-checked
 * - Зелёный когда включён, серый когда выключен
 */

interface Props {
  modelValue?: boolean
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  size: 'md'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Переключение значения (если не disabled)
function toggle(): void {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}

// -----------------------------------------------------------------------------
// Computed классы
// -----------------------------------------------------------------------------

// Классы для "дорожки" (track) — фон переключателя
const trackClasses = computed(() => {
  const base = 'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-[var(--bg-surface)]'

  const sizeMap: Record<string, string> = {
    sm: 'h-5 w-9',
    md: 'h-6 w-11',
    lg: 'h-7 w-14'
  }

  const colorClass = props.modelValue ? 'bg-green-500' : 'bg-[var(--glass-border)]'
  const disabledClass = props.disabled ? 'opacity-50 cursor-not-allowed' : ''

  return `${base} ${sizeMap[props.size]} ${colorClass} ${disabledClass}`
})

// Классы для "ручки" (handle) — круглый элемент который двигается
const handleClasses = computed(() => {
  const base = 'pointer-events-none inline-block transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out'

  // Размер ручки и её смещение в зависимости от состояния
  const sizeMap: Record<string, { size: string; translate: string }> = {
    sm: { size: 'h-4 w-4', translate: props.modelValue ? 'translate-x-4' : 'translate-x-0' },
    md: { size: 'h-5 w-5', translate: props.modelValue ? 'translate-x-5' : 'translate-x-0' },
    lg: { size: 'h-6 w-6', translate: props.modelValue ? 'translate-x-7' : 'translate-x-0' }
  }

  return `${base} ${sizeMap[props.size].size} ${sizeMap[props.size].translate}`
})
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- Переключатель -->
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled"
      :class="trackClasses"
      @click="toggle"
    >
      <span :class="handleClasses" />
    </button>

    <!-- Лейбл и описание (опционально) -->
    <div v-if="label || description" class="flex flex-col">
      <span v-if="label" class="text-sm font-medium text-[var(--text-primary)]">
        {{ label }}
      </span>
      <span v-if="description" class="text-xs text-[var(--text-muted)]">
        {{ description }}
      </span>
    </div>
  </div>
</template>
