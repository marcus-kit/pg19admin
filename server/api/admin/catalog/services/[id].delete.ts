import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID услуги обязателен'
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Проверяем, есть ли подписки на эту услугу
  const { count } = await supabase
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('service_id', id)

  if (count && count > 0) {
    throw createError({
      statusCode: 400,
      message: `Нельзя удалить услугу: есть ${count} активных подписок`
    })
  }

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete service:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при удалении услуги'
    })
  }

  return { success: true }
})
