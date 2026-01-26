<script setup lang="ts">
/**
 * UiVirtualScroll — виртуализация списков
 *
 * Рендерит только видимые элементы + overscan для плавного скролла.
 * Использует transform: translateY для позиционирования.
 */

interface Props {
  /** Массив элементов */
  items: unknown[]
  /** Высота одного элемента в пикселях */
  itemHeight: number
  /** Высота контейнера (px или CSS значение) */
  containerHeight?: number | string
  /** Сколько элементов рендерить за пределами видимой области */
  overscan?: number
  /** Ключ для идентификации элементов */
  itemKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  containerHeight: 600,
  overscan: 5,
  itemKey: 'id',
})

// Позиция скролла
const scrollTop = ref(0)
const containerRef = ref<HTMLElement | null>(null)

// Высота контейнера в пикселях
const containerHeightPx = computed(() => {
  if (typeof props.containerHeight === 'number') return props.containerHeight
  return 600 // fallback
})

// Общая высота всех элементов
const totalHeight = computed(() => props.items.length * props.itemHeight)

// Индексы видимых элементов
const visibleRange = computed(() => {
  const startIndex = Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.overscan)
  const endIndex = Math.min(
    props.items.length,
    Math.ceil((scrollTop.value + containerHeightPx.value) / props.itemHeight) + props.overscan,
  )
  return { startIndex, endIndex }
})

// Видимые элементы с индексами
const visibleItems = computed(() => {
  const { startIndex, endIndex } = visibleRange.value
  return props.items.slice(startIndex, endIndex).map((item, i) => ({
    item,
    index: startIndex + i,
  }))
})

// Смещение для первого видимого элемента
const offsetY = computed(() => visibleRange.value.startIndex * props.itemHeight)

// Обработчик скролла
function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
}

// Прокрутить к элементу
function scrollToIndex(index: number) {
  if (!containerRef.value) return
  containerRef.value.scrollTop = index * props.itemHeight
}

defineExpose({ scrollToIndex })
</script>

<template>
  <div
    ref="containerRef"
    :style="{ height: typeof containerHeight === 'number' ? `${containerHeight}px` : containerHeight }"
    @scroll="handleScroll"
    class="overflow-auto"
  >
    <!-- Spacer для общей высоты -->
    <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
      <!-- Контейнер видимых элементов -->
      <div :style="{ transform: `translateY(${offsetY}px)` }">
        <div
          v-for="{ item, index } in visibleItems"
          :key="(item as Record<string, unknown>)[itemKey] ?? index"
          :style="{ height: `${itemHeight}px` }"
        >
          <slot :item="item" :index="index" />
        </div>
      </div>
    </div>
  </div>
</template>
