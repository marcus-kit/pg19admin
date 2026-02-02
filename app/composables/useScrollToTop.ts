/**
 * Composable для кнопки «Стрелка вверх» (прокрутка в начало).
 * Учитывает скролл и контейнера layout (main), и окна (fallback).
 */
const SCROLL_THRESHOLD = 400

export function useScrollToTop(pageRootRef?: Ref<HTMLElement | null>) {
  const showScrollTop = ref(false)
  let scrollEl: HTMLElement | null = null
  let scrollHandler: () => void

  function updateVisible() {
    const mainScroll = scrollEl?.scrollTop ?? 0
    const windowScroll = typeof window !== 'undefined' ? window.scrollY : 0
    showScrollTop.value = mainScroll > SCROLL_THRESHOLD || windowScroll > SCROLL_THRESHOLD
  }

  function scrollToTop() {
    scrollEl?.scrollTo({ top: 0, behavior: 'smooth' })
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function setupScrollListener() {
    scrollHandler = () => updateVisible()

    // Ищем main: от корня страницы (closest) или глобальный селектор
    if (pageRootRef?.value) {
      scrollEl = pageRootRef.value.closest('main')
    }
    if (!scrollEl) {
      scrollEl = document.querySelector('.layout-root main')
    }

    if (scrollEl) {
      scrollEl.addEventListener('scroll', scrollHandler)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', scrollHandler, { passive: true })
    }
    updateVisible()
  }

  onMounted(() => {
    nextTick(setupScrollListener)
  })

  onUnmounted(() => {
    scrollEl?.removeEventListener('scroll', scrollHandler)
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', scrollHandler)
    }
  })

  return { showScrollTop, scrollToTop }
}
