<script setup lang="ts">
/**
 * AdminRowActions — действия при наведении на строку таблицы
 *
 * Поддерживает: клик, ссылка, dropdown
 */

import type { RowActionConfig } from '~/types/admin-list'
import type { FilterOption } from '~/types/admin'

interface Props {
  actions: RowActionConfig[]
  row: Record<string, unknown>
}

const props = defineProps<Props>()

// Состояние открытого dropdown
const openDropdownKey = ref<string | null>(null)

// Фильтруем видимые действия
const visibleActions = computed(() => {
  return props.actions.filter((action) => {
    if (!action.visible) return true
    return action.visible(props.row)
  })
})

// Проверка типа действия
function isHrefAction(
  action: RowActionConfig,
): action is RowActionConfig & { href: (row: Record<string, unknown>) => string } {
  return 'href' in action
}

function isDropdownAction(
  action: RowActionConfig,
): action is RowActionConfig & {
  dropdown: {
    options: FilterOption[]
    onSelect: (row: Record<string, unknown>, value: string) => void
  }
} {
  return 'dropdown' in action
}

// Обработка клика
function handleClick(action: RowActionConfig) {
  if (isDropdownAction(action)) {
    openDropdownKey.value = openDropdownKey.value === action.key ? null : action.key
    return
  }
  if ('action' in action && action.action) {
    action.action(props.row)
  }
}

// Обработка выбора в dropdown
async function handleDropdownSelect(action: RowActionConfig, value: string) {
  if (isDropdownAction(action)) {
    await action.dropdown.onSelect(props.row, value)
    openDropdownKey.value = null
  }
}

// Закрыть dropdown при клике вне
function closeDropdowns() {
  openDropdownKey.value = null
}

// Закрытие при клике вне
onMounted(() => {
  document.addEventListener('click', closeDropdowns)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns)
})
</script>

<template>
  <div
    @click.stop
    class="admin-row-actions"
  >
    <template v-for="action in visibleActions" :key="action.key">
      <!-- Ссылка -->
      <a
        v-if="isHrefAction(action)"
        :href="action.href(row)"
        :title="action.label"
        @click.stop
        class="admin-row-action"
      >
        <Icon :name="action.icon" class="h-4 w-4" />
      </a>

      <!-- Кнопка или Dropdown trigger -->
      <div v-else class="relative">
        <button
          :title="action.label"
          @click.stop="handleClick(action)"
          class="admin-row-action"
        >
          <Icon :name="action.icon" class="h-4 w-4" />
        </button>

        <!-- Dropdown menu -->
        <Transition name="dropdown">
          <div
            v-if="isDropdownAction(action) && openDropdownKey === action.key"
            class="admin-row-dropdown"
          >
            <button
              v-for="opt in action.dropdown.options"
              :key="opt.value"
              @click.stop="handleDropdownSelect(action, opt.value)"
              class="admin-row-dropdown-item"
            >
              {{ opt.label }}
            </button>
          </div>
        </Transition>
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-row-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.15s ease;
}

/* Показываем при hover на родительскую строку */
:global(tr:hover) .admin-row-actions,
.admin-row-actions:focus-within {
  opacity: 1;
}

.admin-row-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  color: var(--text-muted);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  cursor: pointer;
  transition: all 0.15s ease;
}

.admin-row-action:hover {
  color: var(--text-primary);
  background: var(--primary);
  border-color: var(--primary);
}

.admin-row-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.25rem;
  min-width: 10rem;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 0.5rem;
  padding: 0.25rem;
  z-index: 50;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.admin-row-dropdown-item {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.875rem;
  color: var(--text-secondary);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.admin-row-dropdown-item:hover {
  background: var(--primary);
  color: var(--text-primary);
}

/* Анимация dropdown */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
