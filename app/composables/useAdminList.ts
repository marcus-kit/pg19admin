/**
 * useAdminList — универсальный composable для страниц со списками
 *
 * Обрабатывает общие паттерны: загрузка, фильтрация, пагинация, debounce поиска
 */

import type { Ref } from 'vue'

export interface UseAdminListOptions<T, F extends Record<string, unknown> = Record<string, unknown>> {
  /** API endpoint для загрузки данных */
  endpoint: string
  /** Ключ в ответе с массивом элементов (например, 'users', 'news') */
  responseKey: string
  /** Начальные значения фильтров */
  initialFilters?: F
  /** Задержка debounce для поиска в мс */
  searchDebounceMs?: number
  /** Загружать данные при монтировании */
  fetchOnMount?: boolean
  /** Трансформировать элементы ответа */
  transform?: (items: unknown[]) => T[]
  /**
   * Трансформировать фильтры перед построением query params
   * Используется для виртуальных фильтров — вернуть null/undefined чтобы пропустить параметр
   */
  transformParams?: (filters: F) => Record<string, string | null | undefined>
}

export interface UseAdminListReturn<T, F extends Record<string, unknown>> {
  /** Массив элементов */
  items: Ref<T[]>
  /** Состояние загрузки */
  loading: Ref<boolean>
  /** Общее количество (для пагинации) */
  total: Ref<number>
  /** Текущие фильтры */
  filters: Ref<F>
  /** Поисковый запрос (отдельно от фильтров для debounce) */
  searchQuery: Ref<string>
  /** Загрузить элементы с текущими фильтрами */
  fetchItems: () => Promise<void>
  /** Обновить один фильтр */
  setFilter: <K extends keyof F>(key: K, value: F[K]) => void
  /** Сбросить все фильтры к начальным значениям */
  resetFilters: () => void
  /** Обработчик ввода поиска с debounce */
  onSearchInput: () => void
  /** Удалить элемент по ID */
  deleteItem: (id: string | number, confirmMessage?: string) => Promise<boolean>
}

/**
 * Универсальный composable для списков в админке
 *
 * @example
 * ```ts
 * const { items: users, loading, filters, fetchItems } = useAdminList<User>({
 *   endpoint: '/api/admin/users',
 *   responseKey: 'users',
 *   initialFilters: { status: 'all' }
 * })
 * ```
 */
export function useAdminList<
  T,
  F extends Record<string, unknown> = { status: string },
>(options: UseAdminListOptions<T, F>): UseAdminListReturn<T, F> {
  const {
    endpoint,
    responseKey,
    initialFilters = { status: 'all' } as F,
    searchDebounceMs = 300,
    fetchOnMount = true,
    transform,
    transformParams,
  } = options

  const toast = useToast()

  // Состояние
  const items = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const total = ref(0)
  const filters = ref<F>({ ...initialFilters }) as Ref<F>
  const searchQuery = ref('')
  const searchDebounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

  function buildQueryParams(): URLSearchParams {
    const params = new URLSearchParams()

    // Использовать transformParams если есть, иначе фильтры напрямую
    const paramsToSend = transformParams
      ? transformParams(filters.value)
      : filters.value as Record<string, unknown>

    for (const [key, value] of Object.entries(paramsToSend)) {
      // Пропускаем null, undefined, 'all' и пустые строки
      if (value !== 'all' && value !== '' && value !== null && value !== undefined) {
        params.set(key, String(value))
      }
    }

    const trimmedSearch = searchQuery.value.trim()
    if (trimmedSearch) {
      params.set('search', trimmedSearch)
    }

    return params
  }

  async function fetchItems(): Promise<void> {
    loading.value = true
    try {
      const params = buildQueryParams()
      const url = params.toString() ? `${endpoint}?${params}` : endpoint

      const response = await $fetch<Record<string, unknown>>(url)

      const rawItems = response[responseKey] as unknown[]
      items.value = transform ? transform(rawItems) : (rawItems as T[])

      if ('total' in response && typeof response.total === 'number') {
        total.value = response.total
      }
      else {
        total.value = items.value.length
      }
    }
    catch {
      toast.error('Не удалось загрузить данные')
      items.value = []
      total.value = 0
    }
    finally {
      loading.value = false
    }
  }

  function setFilter<K extends keyof F>(key: K, value: F[K]): void {
    filters.value[key] = value
  }

  function resetFilters(): void {
    filters.value = { ...initialFilters } as F
    searchQuery.value = ''
    fetchItems()
  }

  function onSearchInput(): void {
    if (searchDebounceTimer.value) {
      clearTimeout(searchDebounceTimer.value)
    }
    searchDebounceTimer.value = setTimeout(() => {
      fetchItems()
    }, searchDebounceMs)
  }

  async function deleteItem(
    id: string | number,
    confirmMessage = 'Удалить этот элемент?',
  ): Promise<boolean> {
    if (!confirm(confirmMessage)) return false

    try {
      await $fetch(`${endpoint}/${id}`, { method: 'DELETE' })
      await fetchItems()
      return true
    }
    catch {
      toast.error('Ошибка при удалении')
      return false
    }
  }

  // Следим за фильтрами и перезагружаем
  watch(
    () => ({ ...filters.value }),
    () => fetchItems(),
    { deep: true },
  )

  // Загрузка при монтировании
  if (fetchOnMount) {
    onMounted(() => {
      fetchItems()
    })
  }

  // Очистка таймера debounce
  onUnmounted(() => {
    if (searchDebounceTimer.value) {
      clearTimeout(searchDebounceTimer.value)
    }
  })

  return {
    items,
    loading,
    total,
    filters,
    searchQuery,
    fetchItems,
    setFilter,
    resetFilters,
    onSearchInput,
    deleteItem,
  }
}

// ==================== СПЕЦИАЛИЗИРОВАННЫЕ ВАРИАНТЫ ====================

/**
 * Упрощённая версия для страниц только с фильтром статуса
 */
export function useAdminListSimple<T>(
  endpoint: string,
  responseKey: string,
  defaultStatus: string = 'all',
) {
  return useAdminList<T, { status: string }>({
    endpoint,
    responseKey,
    initialFilters: { status: defaultStatus },
  })
}
