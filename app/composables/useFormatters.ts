/**
 * useFormatters — централизованные утилиты форматирования
 *
 * Доступны всем порталам через наследование Nuxt layer
 */

/**
 * Форматирование даты с относительным временем
 * Показывает "только что", "X мин. назад", "X ч. назад" для недавних дат
 * Для старых дат — локализованная строка
 */
export function formatRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'

  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // Меньше минуты
  if (diff < 60000) return 'только что'

  // Меньше часа
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000)
    return `${mins} мин. назад`
  }

  // Меньше суток
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours} ч. назад`
  }

  // Сегодня — только время
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  // Вчера
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return 'вчера ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  // Остальные даты
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

/**
 * Форматирование даты со временем для логов/истории
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'

  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Форматирование даты без времени
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'

  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Короткий формат даты (для таблиц)
 */
export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'

  const date = new Date(dateStr)
  const now = new Date()

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

/**
 * Только время (для сообщений чата)
 */
export function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Форматирование копеек в рубли (без символа валюты)
 * Вход: 150050 (копейки)
 * Выход: "1 500,50"
 * Используется когда ₽ показывается отдельно
 */
export function formatKopeks(kopeks: number | null | undefined): string {
  if (kopeks === null || kopeks === undefined) return '—'

  return (kopeks / 100).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/**
 * Форматирование размера файла
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '—'

  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} ГБ`
}

/**
 * Обрезка текста с многоточием
 */
export function truncateText(text: string | null | undefined, maxLength: number = 100): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Форматирование номера договора
 */
export function formatContractNumber(number: number | null | undefined): string {
  if (number === null || number === undefined) return '—'
  return number.toString().padStart(6, '0')
}

/**
 * Форматирование баланса (копейки в рубли со знаком ₽)
 */
export function formatBalance(kopeks: number | null | undefined): string {
  if (kopeks === null || kopeks === undefined) return '—'
  const rubles = kopeks / 100
  return rubles.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' ₽'
}

/**
 * Форматирование номера телефона
 * Вход: "+79001234567" или "79001234567"
 * Выход: "+7 (900) 123-45-67"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—'

  // Удаляем все нецифровые символы
  const digits = phone.replace(/\D/g, '')

  // Российский формат телефона
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
  }

  if (digits.length === 10) {
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`
  }

  // Возвращаем как есть, если нестандартный формат
  return phone
}

/**
 * Форматирование цены (копейки в рубли с символом валюты)
 */
export function formatPrice(kopeks: number | null | undefined): string {
  if (kopeks === null || kopeks === undefined) return '—'
  const rubles = kopeks / 100
  return rubles.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }) + ' ₽'
}

// ==================== ХЕЛПЕРЫ ДЛЯ ОШИБОК ====================

/**
 * Извлекает HTTP статус код из ошибки (для H3/Nuxt ошибок)
 * @param error — неизвестная ошибка из catch блока
 * @returns статус код или undefined
 */
export function getErrorStatusCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    return (error as { statusCode: number }).statusCode
  }
  return undefined
}

/**
 * Извлекает сообщение из ошибки
 * @param error — неизвестная ошибка из catch блока
 * @returns строка с сообщением ошибки
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

// ==================== COMPOSABLE ====================

/**
 * Composable для доступа ко всем форматтерам
 */
export function useFormatters() {
  return {
    formatRelativeDate,
    formatDateTime,
    formatDate,
    formatDateShort,
    formatTime,
    formatKopeks,
    formatFileSize,
    truncateText,
    formatContractNumber,
    formatBalance,
    formatPhone,
    formatPrice,
    getErrorStatusCode,
    getErrorMessage,
  }
}
