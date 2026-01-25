<script setup lang="ts">
/**
 * UiLoading — индикатор загрузки
 *
 * Использование:
 * <UiLoading />                    — стандартный спиннер
 * <UiLoading size="lg" />          — большой спиннер
 * <UiLoading text="Загрузка..." /> — с текстом
 */

interface Props {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

withDefaults(defineProps<Props>(), {
  size: 'md',
})

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12">
    <Icon
      :class="sizeClasses[size]"
      name="heroicons:arrow-path"
      class="animate-spin text-primary"
    />
    <p v-if="text" class="mt-3 text-sm text-[var(--text-muted)]">
      {{ text }}
    </p>
  </div>
</template>
