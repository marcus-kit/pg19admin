<script setup lang="ts">
import type { Ticket } from '~/types/admin'

interface Props {
  ticket: Ticket
  saving?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  back: []
  assignToMe: []
}>()
</script>

<template>
  <div class="flex items-start justify-between gap-4 mb-6">
    <div>
      <div class="flex items-center gap-3 mb-2">
        <UiButton variant="ghost" size="sm" @click="emit('back')">
          <Icon name="heroicons:arrow-left" class="w-5 h-5" />
        </UiButton>
        <span class="font-mono text-primary">{{ ticket.number }}</span>
      </div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">
        {{ ticket.subject }}
      </h1>
    </div>

    <div class="flex gap-2">
      <UiButton
        v-if="!ticket.assignedAdmin && ticket.status !== 'closed'"
        :disabled="saving"
        variant="secondary"
        size="sm"
        @click="emit('assignToMe')"
      >
        <Icon name="heroicons:hand-raised" class="w-4 h-4" />
        Взять себе
      </UiButton>
    </div>
  </div>
</template>
