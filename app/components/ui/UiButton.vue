<script setup lang="ts">
/**
 * UiButton — базовая кнопка с вариантами стилей
 *
 * Варианты (variant):
 * - primary  — градиент оранжевый→розовый, основное действие
 * - secondary — прозрачная с рамкой
 * - ghost    — прозрачная без рамки
 * - danger   — красная, деструктивное действие
 * - success  — зелёная, подтверждение
 *
 * Размеры (size): sm, md, lg
 * Модификаторы: block (100% ширина), loading (спиннер), disabled
 *
 * Стили в глобальном CSS (не scoped) — для возможности переопределения извне
 */

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  block?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  block: false
})
</script>

<template>
  <button
    class="u-btn"
    :class="[
      `u-btn--${variant}`,
      `u-btn--${size}`,
      block && 'u-btn--block',
      (disabled || loading) && 'u-btn--disabled'
    ]"
    :disabled="disabled || loading"
  >
    <!-- Спиннер при загрузке -->
    <Icon v-if="loading" name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
    <slot />
  </button>
</template>

<!-- Глобальные стили (без scoped) для возможности переопределения через !important -->
<style>
.u-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
}

.u-btn--sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  gap: 0.375rem;
}

.u-btn--md {
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  gap: 0.5rem;
}

.u-btn--lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  gap: 0.5rem;
}

.u-btn--primary {
  background: linear-gradient(to right, #F7941D, #E91E8C) !important;
  color: white !important;
  box-shadow: 0 10px 15px -3px rgba(247, 148, 29, 0.3);
}

.u-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(247, 148, 29, 0.4);
}

.u-btn--secondary {
  background: transparent;
  color: var(--btn-secondary-text);
  border: 2px solid var(--btn-secondary-border);
}

.u-btn--secondary:hover {
  border-color: #F7941D;
  color: #F7941D;
  background: var(--btn-secondary-hover-bg);
}

.u-btn--ghost {
  background: transparent;
  color: var(--text-secondary);
}

.u-btn--ghost:hover {
  color: var(--text-primary);
  background: var(--glass-bg);
}

.u-btn--danger {
  background: #dc2626;
  color: white;
}

.u-btn--danger:hover {
  background: #b91c1c;
}

.u-btn--success {
  background: #00A651;
  color: white;
  box-shadow: 0 10px 15px -3px rgba(0, 166, 81, 0.3);
}

.u-btn--success:hover {
  background: #008541;
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 166, 81, 0.4);
}

.u-btn--block {
  width: 100%;
}

.u-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
