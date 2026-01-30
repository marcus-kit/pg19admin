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
  <div class="flex gap-1 flex-wrap" role="tablist">
    <UiButton
      v-for="opt in props.options"
      :key="opt.value"
      :aria-selected="model === opt.value"
      :class="[
        'transition-colors',
        model === opt.value
          ? 'bg-primary/25 text-primary font-semibold ring-2 ring-primary/50 ring-inset border border-primary/40'
          : 'hover:bg-white/5',
      ]"
      :size="size"
      role="tab"
      variant="ghost"
      @click="model = opt.value"
    >
      {{ opt.label }}
    </UiButton>
  </div>
</template>
