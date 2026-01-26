<script setup lang="ts">
/**
 * UiToastContainer — контейнер для toast-уведомлений
 *
 * Размещается в layout, автоматически отображает уведомления из useToast.
 * Поддерживает 4 типа: success, error, warning, info.
 * Glass-морфизм стиль, анимации появления/исчезновения.
 */
import type { Toast } from '~/composables/useToast'

// =============================================================================
// COMPOSABLES
// =============================================================================
const { toasts, remove } = useToast()

// =============================================================================
// COMPUTED
// =============================================================================
const icons: Record<Toast['type'], string> = {
  success: 'heroicons:check-circle',
  error: 'heroicons:x-circle',
  warning: 'heroicons:exclamation-triangle',
  info: 'heroicons:information-circle',
}

const colors: Record<Toast['type'], string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
}

const bgColors: Record<Toast['type'], string> = {
  success: 'border-green-500/30',
  error: 'border-red-500/30',
  warning: 'border-yellow-500/30',
  info: 'border-blue-500/30',
}
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div class="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <TransitionGroup
          enter-active-class="transition-all duration-300 ease-out"
          leave-active-class="transition-all duration-200 ease-in"
          enter-from-class="opacity-0 translate-x-4 scale-95"
          leave-to-class="opacity-0 translate-x-4 scale-95"
        >
          <div
            v-for="toast in toasts"
            :key="toast.id"
            :class="bgColors[toast.type]"
            class="pointer-events-auto glass-card-static rounded-xl p-4 flex items-start gap-3 border"
          >
            <!-- Icon -->
            <Icon
              :name="icons[toast.type]"
              :class="colors[toast.type]"
              class="w-5 h-5 flex-shrink-0 mt-0.5"
            />

            <!-- Message -->
            <p class="flex-1 text-sm text-[var(--text-primary)]">
              {{ toast.message }}
            </p>

            <!-- Close button -->
            <button
              @click="remove(toast.id)"
              class="flex-shrink-0 p-1 rounded-lg hover:bg-[var(--glass-bg)] transition-colors"
            >
              <Icon
                name="heroicons:x-mark"
                class="w-4 h-4 text-[var(--text-muted)]"
              />
            </button>
          </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </ClientOnly>
</template>
