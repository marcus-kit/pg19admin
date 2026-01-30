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
  <div class="flex gap-2 flex-wrap" role="tablist">
    <button
      v-for="opt in props.options"
      :key="opt.value"
      type="button"
      role="tab"
      :aria-selected="model === opt.value"
      :class="[
        'px-4 py-2 text-sm rounded-lg border transition-colors',
        size === 'sm' ? 'text-sm' : 'text-base',
        model === opt.value
          ? 'bg-primary text-white border-primary font-semibold shadow-sm ring-2 ring-primary/30'
          : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)] hover:text-[var(--text-primary)]',
      ]"
      @click="model = opt.value"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
