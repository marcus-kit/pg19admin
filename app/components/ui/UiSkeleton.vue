<script setup lang="ts">
/**
 * UiSkeleton — placeholder для загрузки контента
 *
 * Варианты:
 * - text: строка текста (разная высота)
 * - circle: круг (аватар)
 * - rect: прямоугольник (карточка, изображение)
 *
 * Автоматическая анимация пульсации (animate-pulse)
 */

interface Props {
  variant?: 'text' | 'circle' | 'rect'
  width?: string   // CSS width (например, '100%', '200px', '50%')
  height?: string  // CSS height
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text',
  rounded: 'md'
})

// Классы скругления
const roundedClasses: Record<string, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full'
}

// Стили по умолчанию для каждого варианта
const defaultStyles = computed(() => {
  switch (props.variant) {
    case 'circle':
      return {
        width: props.width || '40px',
        height: props.height || '40px'
      }
    case 'rect':
      return {
        width: props.width || '100%',
        height: props.height || '100px'
      }
    default: // text
      return {
        width: props.width || '100%',
        height: props.height || '16px'
      }
  }
})

// Класс скругления (для circle всегда full)
const roundedClass = computed(() => {
  if (props.variant === 'circle') return 'rounded-full'
  return roundedClasses[props.rounded]
})
</script>

<template>
  <div
    class="animate-pulse bg-[var(--glass-bg)]"
    :class="roundedClass"
    :style="{
      width: defaultStyles.width,
      height: defaultStyles.height
    }"
  />
</template>
