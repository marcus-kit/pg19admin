<script setup lang="ts">
/**
 * UiErrorState — состояние ошибки
 *
 * Используется когда:
 * - Ошибка загрузки данных
 * - Сетевая ошибка
 * - Ошибка доступа (403, 404)
 *
 * Структура: иконка + заголовок + описание + кнопка повтора
 */

interface Props {
  icon?: string
  title?: string
  description?: string
  retryText?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'heroicons:exclamation-triangle',
  title: 'Произошла ошибка',
  description: 'Не удалось загрузить данные. Попробуйте позже.',
  retryText: 'Повторить',
})

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="text-center py-8">
    <!-- Иконка -->
    <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-500/10">
      <Icon :name="icon" class="w-8 h-8 text-red-400" />
    </div>

    <!-- Заголовок -->
    <h3 class="text-lg font-medium text-[var(--text-primary)] mb-1">
      {{ title }}
    </h3>

    <!-- Описание -->
    <p v-if="description" class="text-sm text-[var(--text-muted)] mb-4">
      {{ description }}
    </p>

    <!-- Кнопка повтора -->
    <UiButton @click="emit('retry')">
      <Icon name="heroicons:arrow-path" class="w-4 h-4 mr-2" />
      {{ retryText }}
    </UiButton>

    <!-- Слот для дополнительных действий -->
    <slot />
  </div>
</template>
