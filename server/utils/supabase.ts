import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabaseClient: SupabaseClient | null = null

/**
 * Returns Supabase client for admin server operations.
 * Uses service_role key for full database access.
 *
 * @example
 * ```ts
 * // In API endpoint
 * export default defineEventHandler(async (event) => {
 *   const supabase = useSupabaseAdmin()
 *   const { data } = await supabase.from('users').select()
 * })
 * ```
 */
export function useSupabaseAdmin(): SupabaseClient {
  if (_supabaseClient) {
    return _supabaseClient
  }

  const config = useRuntimeConfig()

  _supabaseClient = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  return _supabaseClient
}
