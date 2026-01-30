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
  <div class="flex flex-col gap-1">
    <UiButton
      v-for="opt in props.options"
      :key="opt.value"
      :variant="model === opt.value ? 'primary' : 'ghost'"
      :class="[
        'filter-tab-button flex items-center gap-2 transition-all duration-300 ease-in-out w-full',
        model === opt.value 
          ? 'bg-primary/20 text-primary font-medium scale-[1.02]' 
          : 'hover:bg-[var(--glass-bg)]'
      ]"
      :size="size"
      @click="model = opt.value"
    >
      <Transition name="fade-scale" mode="out-in">
        <Icon
          v-if="model === opt.value"
          key="check"
          name="heroicons:check"
          class="w-4 h-4 flex-shrink-0 text-primary"
        />
        <span v-else key="space" class="w-4"></span>
      </Transition>
      <span class="transition-colors duration-300 text-left">{{ opt.label }}</span>
    </UiButton>
  </div>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}

.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* Переопределяем выравнивание для кнопок фильтров */
:deep(.filter-tab-button) {
  justify-content: flex-start !important;
  text-align: left;
}
</style>
