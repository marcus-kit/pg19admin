<script setup lang="ts">
/**
 * UiStatCard — карточка статистики для дашборда
 *
 * Использование:
 * <UiStatCard
 *   label="Всего"
 *   :value="stats.total"
 *   icon="heroicons:document-text"
 *   color="primary"
 * />
 *
 * Цвета: primary, green, red, yellow, orange, blue, purple, cyan, gray
 */

interface Props {
  label: string
  value: number | string
  icon: string
  color?: 'primary' | 'green' | 'red' | 'yellow' | 'orange' | 'blue' | 'purple' | 'cyan' | 'gray' | 'amber' | 'indigo'
}

withDefaults(defineProps<Props>(), {
  color: 'primary',
})

// Маппинг цветов на Tailwind классы
const colorClasses: Record<string, { text: string, bg: string }> = {
  primary: { text: 'text-primary', bg: 'bg-primary/20' },
  green: { text: 'text-green-400', bg: 'bg-green-500/20' },
  red: { text: 'text-red-400', bg: 'bg-red-500/20' },
  yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  orange: { text: 'text-orange-400', bg: 'bg-orange-500/20' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-500/20' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/20' },
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  gray: { text: 'text-gray-400', bg: 'bg-gray-500/20' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-500/20' },
  indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500/20' },
}
</script>

<template>
  <div class="glass-card p-4 rounded-xl">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-[var(--text-muted)] mb-1">{{ label }}</p>
        <p :class="color === 'primary' ? 'text-[var(--text-primary)]' : colorClasses[color].text" class="text-2xl font-bold">
          {{ value }}
        </p>
      </div>
      <div
        :class="colorClasses[color].bg"
        class="w-10 h-10 rounded-lg flex items-center justify-center"
      >
        <Icon :name="icon" :class="colorClasses[color].text" class="w-5 h-5" />
      </div>
    </div>
  </div>
</template>
