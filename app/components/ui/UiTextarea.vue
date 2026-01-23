<script setup lang="ts">
/**
 * UiTextarea — многострочное текстовое поле
 *
 * Особенности:
 * - v-model для двусторонней привязки
 * - Опциональный лейбл над полем
 * - Отображение ошибки валидации
 * - Glass-стиль (полупрозрачный фон)
 * - Настраиваемое количество строк
 * - resize: none по умолчанию
 */

interface Props {
  modelValue?: string
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  rows?: number
  required?: boolean
  maxlength?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  rows: 4,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Двусторонняя привязка для v-model
const textareaValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>

<template>
  <div class="w-full">
    <!-- Лейбл -->
    <label v-if="label" class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
      {{ label }}
      <span v-if="required" class="text-primary">*</span>
    </label>

    <!-- Textarea -->
    <textarea
      v-model="textareaValue"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :maxlength="maxlength"
      class="w-full px-4 py-3 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
      :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500/20': error }"
      :style="{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)'
      }"
    />

    <!-- Счётчик символов (если задан maxlength) -->
    <div v-if="maxlength" class="flex justify-end mt-1">
      <span class="text-xs text-[var(--text-muted)]">
        {{ modelValue?.length || 0 }} / {{ maxlength }}
      </span>
    </div>

    <!-- Сообщение об ошибке -->
    <p v-if="error" class="mt-1.5 text-sm text-red-400">{{ error }}</p>
  </div>
</template>
