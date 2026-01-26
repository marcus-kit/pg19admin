import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Получает обязательный параметр из URL, выбрасывает 400 если отсутствует
 *
 * @example
 * const id = requireParam(event, 'id', 'пользователя')
 * // throws 400 "ID пользователя не указан" if missing
 */
export function requireParam(
  event: H3Event,
  paramName: string,
  entityName?: string,
): string {
  const value = getRouterParam(event, paramName)
  if (!value) {
    throw createError({
      statusCode: 400,
      message: entityName
        ? `ID ${entityName} не указан`
        : `Параметр ${paramName} не указан`,
    })
  }
  return value
}

/**
 * Обрабатывает ошибку Supabase, логирует и выбрасывает 500
 *
 * @example
 * const { data, error } = await supabase.from('users').select()
 * if (error) throwSupabaseError(error, 'загрузке пользователей')
 */
export function throwSupabaseError(
  error: unknown,
  context: string,
): never {
  console.error(`Failed to ${context}:`, error)
  throw createError({
    statusCode: 500,
    message: `Ошибка при ${context}`,
  })
}

/**
 * Проверяет существование сущности в БД, возвращает данные или выбрасывает 404
 *
 * @example
 * const user = await requireEntity(supabase, 'users', id, 'Пользователь')
 */
export async function requireEntity<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  id: string,
  entityName: string,
  select: string = 'id',
): Promise<T> {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq('id', id)
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 404,
      message: `${entityName} не найден`,
    })
  }

  return data as T
}

/**
 * Загружает связанные данные по массиву ID (решает N+1 проблему)
 *
 * @example
 * const usersMap = await loadRelatedMap(supabase, 'users', userIds, 'id, full_name')
 * // Returns: { 'uuid1': { id: 'uuid1', full_name: 'Иван' }, ... }
 */
export async function loadRelatedMap<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  ids: (string | null | undefined)[],
  select: string = 'id',
): Promise<Map<string, T>> {
  const uniqueIds = [...new Set(ids.filter((id): id is string => !!id))]

  if (uniqueIds.length === 0) {
    return new Map()
  }

  const { data } = await supabase
    .from(table)
    .select(select)
    .in('id', uniqueIds)

  if (!data) {
    return new Map()
  }

  return new Map(data.map(item => [(item as { id: string }).id, item as T]))
}

/**
 * Маппинг camelCase → snake_case для update операций
 * Пропускает undefined значения
 *
 * @example
 * const updateData = mapToSnakeCase(body, {
 *   firstName: 'first_name',
 *   lastName: 'last_name',
 * })
 */
export function mapToSnakeCase(
  body: Record<string, unknown>,
  mapping: Record<string, string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [camelKey, snakeKey] of Object.entries(mapping)) {
    if (body[camelKey] !== undefined) {
      result[snakeKey] = body[camelKey]
    }
  }

  return result
}
