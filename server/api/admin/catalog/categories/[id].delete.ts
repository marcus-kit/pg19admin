import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { requireParam, throwSupabaseError } from '~~/server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = requireParam(event, 'id', 'категории')
  const supabase = useSupabaseAdmin(event)

  // Проверяем, есть ли услуги в этой категории
  const { count } = await supabase
    .from('services')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)

  if (count && count > 0) {
    throw createError({
      statusCode: 400,
      message: `Нельзя удалить категорию: в ней ${count} услуг(и)`,
    })
  }

  const { error } = await supabase
    .from('service_categories')
    .delete()
    .eq('id', id)

  if (error) throwSupabaseError(error, 'удалении категории')

  return { success: true }
})
