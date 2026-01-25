<script setup lang="ts">
/**
 * UiCard — карточка с glass-эффектом
 *
 * Использует CSS класс .glass-card из main.css для:
 * - Полупрозрачный фон с blur
 * - Тонкая рамка
 * - Hover-эффект (если hover=true)
 *
 * Padding: none (0), sm (16px), md (24px), lg (32px)
 */

interface Props {
  hover?: boolean // Добавить hover-эффект (pointer + подсветка)
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  hover: false,
  padding: 'md',
})

// Маппинг padding на Tailwind классы
const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}
</script>

<template>
  <div
    :class="[
      paddingClasses[padding],
      hover && 'cursor-pointer',
    ]"
    class="glass-card rounded-2xl"
  >
    <slot />
  </div>
</template>
