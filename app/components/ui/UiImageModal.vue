<script setup lang="ts">
/**
 * UiImageModal — модальное окно для просмотра изображений
 */

interface Props {
  show: boolean
  imageUrl: string
  imageAlt?: string
}

const props = withDefaults(defineProps<Props>(), {
  imageAlt: 'Изображение',
})

const emit = defineEmits<{
  close: []
}>()

// Закрытие модалки
function handleClose() {
  emit('close')
}

// Закрытие по ESC
function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') handleClose()
}

// Закрытие по клику на фон
function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
  }
  else {
    document.removeEventListener('keydown', handleEscape)
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="show"
          @click="handleBackdropClick"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background-color: rgba(0, 0, 0, 0.9);"
        >
          <!-- Close button -->
          <button
            @click="handleClose"
            class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
            title="Закрыть (ESC)"
          >
            <Icon name="heroicons:x-mark" class="w-6 h-6 text-white" />
          </button>

          <!-- Image container -->
          <div class="relative max-w-full max-h-full">
            <img
              :src="imageUrl"
              :alt="imageAlt"
              class="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
