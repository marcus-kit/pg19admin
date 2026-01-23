import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  // Выход через Supabase Auth
  // Cookie удаляется автоматически модулем @nuxtjs/supabase
  await supabase.auth.signOut()

  return {
    success: true,
    message: 'Успешный выход'
  }
})
