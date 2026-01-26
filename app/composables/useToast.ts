/**
 * useToast — система уведомлений (toast notifications)
 *
 * Использование:
 * const toast = useToast()
 * toast.success('Сохранено!')
 * toast.error('Не удалось загрузить данные')
 * toast.warning('Внимание!')
 * toast.info('Информация')
 */

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration: number
}

export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  /**
   * Показать уведомление
   */
  function show(type: Toast['type'], message: string, duration = 5000) {
    const id = Date.now().toString() + Math.random().toString(36).slice(2)
    toasts.value.push({ id, type, message, duration })

    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
  }

  /**
   * Удалить уведомление
   */
  function remove(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  /**
   * Очистить все уведомления
   */
  function clear() {
    toasts.value = []
  }

  /** Показать уведомление об успехе */
  function success(message: string, duration?: number) {
    show('success', message, duration)
  }

  /** Показать уведомление об ошибке (по умолчанию 8 секунд) */
  function error(message: string, duration?: number) {
    show('error', message, duration ?? 8000)
  }

  /** Показать предупреждение */
  function warning(message: string, duration?: number) {
    show('warning', message, duration)
  }

  /** Показать информационное уведомление */
  function info(message: string, duration?: number) {
    show('info', message, duration)
  }

  return {
    toasts: readonly(toasts),
    show,
    remove,
    clear,
    success,
    error,
    warning,
    info,
  }
}
