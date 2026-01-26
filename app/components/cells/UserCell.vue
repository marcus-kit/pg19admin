<script setup lang="ts">
/**
 * UserCell — ячейка с аватаром, именем и онлайн-статусом
 */

interface Props {
  user: {
    avatar?: string | null
    firstName?: string | null
    lastName?: string | null
    fullName?: string | null
    onlineStatus?: string
    telegram?: { username?: string } | null
  }
  showOnlineStatus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showOnlineStatus: true,
})

// Инициалы для аватара
const initials = computed(() => {
  const first = props.user.firstName?.charAt(0) || ''
  const last = props.user.lastName?.charAt(0) || ''
  return first + last || '?'
})

// Имя для отображения
const displayName = computed(() => {
  return props.user.fullName || `${props.user.firstName || ''} ${props.user.lastName || ''}`.trim() || '—'
})

// Класс онлайн-индикатора
function getOnlineStatusClass(status?: string) {
  switch (status) {
    case 'online': return 'bg-green-500'
    case 'away': return 'bg-yellow-500'
    default: return 'bg-gray-500'
  }
}
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- Avatar -->
    <div class="relative">
      <div
        v-if="user.avatar"
        :style="{ backgroundImage: `url(${user.avatar})` }"
        class="h-10 w-10 rounded-full bg-cover bg-center"
      />
      <div
        v-else
        class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-secondary/30"
      >
        <span class="text-sm font-medium text-[var(--text-primary)]">
          {{ initials }}
        </span>
      </div>
      <!-- Online indicator -->
      <div
        v-if="showOnlineStatus"
        :class="getOnlineStatusClass(user.onlineStatus)"
        class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--bg-base)]"
      />
    </div>
    <!-- Name -->
    <div>
      <p class="font-medium text-[var(--text-primary)]">{{ displayName }}</p>
      <p v-if="user.telegram?.username" class="text-xs text-[var(--text-muted)]">
        @{{ user.telegram.username }}
      </p>
    </div>
  </div>
</template>
