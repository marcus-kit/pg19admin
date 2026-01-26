import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { requireParam, throwSupabaseError } from '~~/server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = requireParam(event, 'id', 'услуги')
  const supabase = useSupabaseAdmin(event)

  // Проверяем, есть ли подписки на эту услугу
  const { count } = await supabase
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('service_id', id)

  if (count && count > 0) {
    throw createError({
      statusCode: 400,
      message: `Нельзя удалить услугу: есть ${count} активных подписок`,
    })
  }

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) throwSupabaseError(error, 'удалении услуги')

  return { success: true }
})
