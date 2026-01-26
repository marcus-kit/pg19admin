<script setup lang="ts">
interface Props {
  show: boolean
  title?: string
  itemName: string
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Подтверждение удаления',
  message: 'Это действие необратимо. Для подтверждения введите:',
})

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const confirmInput = ref('')

// Требуем ввести "DELETE {itemName}"
const expectedValue = computed(() => `DELETE ${props.itemName}`)

const isValid = computed(() => {
  return confirmInput.value.trim() === expectedValue.value
})

const handleConfirm = () => {
  if (isValid.value) {
    emit('confirm')
    confirmInput.value = ''
  }
}

const handleClose = () => {
  confirmInput.value = ''
  emit('close')
}

// Закрытие по ESC
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') handleClose()
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
  }
  else {
    document.removeEventListener('keydown', handleEscape)
    document.body.style.overflow = ''
    confirmInput.value = ''
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
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background-color: rgba(0, 0, 0, 0.85);"
          @click.self="handleClose"
        >
          <div
            class="w-full max-w-md rounded-2xl p-6"
            style="background: var(--bg-surface); border: 1px solid var(--glass-border);"
          >
            <!-- Header -->
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Icon name="heroicons:exclamation-triangle" class="w-6 h-6 text-red-400" />
              </div>
              <h3 class="text-lg font-semibold text-[var(--text-primary)]">
                {{ title }}
              </h3>
            </div>

            <!-- Message -->
            <p class="text-[var(--text-secondary)] mb-4">
              {{ message }}
            </p>

            <!-- Expected value display -->
            <div class="mb-4 p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <code class="text-red-400 font-medium">{{ expectedValue }}</code>
            </div>

            <!-- Confirm input -->
            <div class="mb-6">
              <input
                v-model="confirmInput"
                type="text"
                class="w-full px-4 py-3 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-red-500/50"
                style="background: var(--glass-bg); border: 1px solid var(--glass-border);"
                placeholder="Введите DELETE и название"
                @keyup.enter="handleConfirm"
              />
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              <UiButton
                variant="secondary"
                class="flex-1"
                @click="handleClose"
              >
                Отмена
              </UiButton>
              <UiButton
                :disabled="!isValid"
                variant="danger"
                class="flex-1"
                @click="handleConfirm"
              >
                <Icon name="heroicons:trash" class="w-4 h-4 mr-2" />
                Удалить
              </UiButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
