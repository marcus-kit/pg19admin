/**
 * Generic composable for admin list pages
 * Handles common patterns: loading, fetching, filtering, pagination, search debounce
 */

import type { Ref } from 'vue'

export interface UseAdminListOptions<T, F extends Record<string, unknown> = Record<string, unknown>> {
  /** API endpoint to fetch data from */
  endpoint: string
  /** Key in response containing items array (e.g., 'users', 'news') */
  responseKey: string
  /** Initial filter values */
  initialFilters?: F
  /** Debounce delay for search in ms */
  searchDebounceMs?: number
  /** Auto-fetch on mount */
  fetchOnMount?: boolean
  /** Transform response items */
  transform?: (items: unknown[]) => T[]
  /**
   * Transform filters before building query params
   * Use for virtual filters like 'active' → don't send to API
   * Return null/undefined to skip a param
   */
  transformParams?: (filters: F) => Record<string, string | null | undefined>
}

export interface UseAdminListReturn<T, F extends Record<string, unknown>> {
  /** Items array */
  items: Ref<T[]>
  /** Loading state */
  loading: Ref<boolean>
  /** Total count (for pagination) */
  total: Ref<number>
  /** Current filters */
  filters: Ref<F>
  /** Search query (separate from filters for debounce) */
  searchQuery: Ref<string>
  /** Fetch items with current filters */
  fetchItems: () => Promise<void>
  /** Update single filter and refetch */
  setFilter: <K extends keyof F>(key: K, value: F[K]) => void
  /** Reset all filters to initial values */
  resetFilters: () => void
  /** Handle search input with debounce */
  onSearchInput: () => void
  /** Delete item by ID */
  deleteItem: (id: string | number, confirmMessage?: string) => Promise<boolean>
}

/**
 * Generic list composable for admin pages
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

  // State
  const items = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const total = ref(0)
  const filters = ref<F>({ ...initialFilters }) as Ref<F>
  const searchQuery = ref('')
  const searchDebounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

  function buildQueryParams(): URLSearchParams {
    const params = new URLSearchParams()

    // Use transformParams if provided, otherwise use filters directly
    const paramsToSend = transformParams
      ? transformParams(filters.value)
      : filters.value as Record<string, unknown>

    for (const [key, value] of Object.entries(paramsToSend)) {
      // Skip null, undefined, 'all', and empty strings
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
    catch (error) {
      console.error(`Failed to fetch ${responseKey}:`, error)
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
    catch (error) {
      console.error(`Failed to delete ${responseKey} item:`, error)
      toast.error('Ошибка при удалении')
      return false
    }
  }

  // Watch filters and refetch
  watch(
    () => ({ ...filters.value }),
    () => fetchItems(),
    { deep: true },
  )

  // Fetch on mount
  if (fetchOnMount) {
    onMounted(() => {
      fetchItems()
    })
  }

  // Cleanup debounce timer
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

// ==================== SPECIALIZED VARIANTS ====================

/**
 * Simplified version for pages with just status filter
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
