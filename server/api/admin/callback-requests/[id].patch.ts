import { useSupabaseAdmin, getAdminId } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const supabase = useSupabaseAdmin(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID заявки не указан',
    })
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (body.status) {
    updateData.status = body.status

    // Если статус меняется на обработанный, записываем кто обработал
    if (['completed', 'rejected'].includes(body.status)) {
      const adminId = await getAdminId(event)
      updateData.processed_by = adminId
      updateData.processed_at = new Date().toISOString()
    }
  }

  const { error } = await supabase
    .from('callback_requests')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Failed to update callback request:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении заявки',
    })
  }

  return { success: true }
})
