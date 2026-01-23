import { serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'

/**
 * Returns Supabase client for admin server operations.
 * Uses service_role key for full database access.
 * Wrapper around @nuxtjs/supabase serverSupabaseServiceRole.
 *
 * @example
 * ```ts
 * // In API endpoint
 * export default defineEventHandler(async (event) => {
 *   const supabase = useSupabaseAdmin(event)
 *   const { data } = await supabase.from('users').select()
 * })
 * ```
 */
export function useSupabaseAdmin(event: H3Event) {
  return serverSupabaseServiceRole(event)
}
