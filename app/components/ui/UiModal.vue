<script setup lang="ts">
/**
 * UiModal — модальное окно
 *
 * Особенности:
 * - Teleport в body (поверх всего контента)
 * - Закрытие по клику на backdrop
 * - Закрытие по Escape
 * - Анимация появления/исчезновения
 * - Настраиваемая ширина (sm, md, lg, xl)
 * - Блокировка скролла body при открытии
 */

interface Props {
  modelValue: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closeOnBackdrop: true,
  closeOnEscape: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Закрытие модалки
function close(): void {
  emit('update:modelValue', false)
}

// Обработка клика по backdrop
function handleBackdropClick(): void {
  if (props.closeOnBackdrop) {
    close()
  }
}

// Обработка Escape
function handleEscape(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.closeOnEscape) {
    close()
  }
}

// Размеры модалки
const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

// Блокировка скролла body
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)
  }
  else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', handleEscape)
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background-color: var(--modal-backdrop, rgba(0, 0, 0, 0.5));"
        @click.self="handleBackdropClick"
      >
        <!-- Контент модалки -->
        <Transition
          enter-active-class="transition-all duration-200"
          leave-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
            :class="sizeClasses[size]"
            class="w-full rounded-2xl"
            style="background: var(--bg-surface); border: 1px solid var(--glass-border);"
          >
            <slot />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
