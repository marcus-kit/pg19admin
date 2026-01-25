<script setup lang="ts">
/**
 * UiFilterTabs — табы для фильтрации списков
 *
 * Использование:
 * <UiFilterTabs
 *   v-model="statusFilter"
 *   :options="STATUS_OPTIONS"
 * />
 *
 * Options format: { value: string, label: string }[]
 */

interface FilterOption {
  value: string
  label: string
}

interface Props {
  options: FilterOption[]
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
})

const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="flex gap-1 flex-wrap">
    <UiButton
      v-for="opt in props.options"
      :key="opt.value"
      :class="{ 'bg-primary/20': model === opt.value }"
      :size="size"
      variant="ghost"
      @click="model = opt.value"
    >
      {{ opt.label }}
    </UiButton>
  </div>
</template>
