<script setup lang="ts">
/**
 * ContactsCell — ячейка с телефоном и email
 */

interface Props {
  phone?: string | null
  email?: string | null
}

defineProps<Props>()
</script>

<template>
  <div class="text-sm">
    <p v-if="phone" class="text-[var(--text-muted)]">{{ phone }}</p>
    <p v-if="email" class="text-xs text-[var(--text-muted)]">{{ email }}</p>
    <p v-if="!phone && !email" class="text-[var(--text-muted)]">—</p>
  </div>
</template>
