// PUT /api/admin/callbacks/:id
// Обновление статуса заявки на обратный звонок

import { getAdminFromEvent, useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const admin = await getAdminFromEvent(event)
  const callbackId = getRouterParam(event, 'id')

  if (!callbackId) {
    throw createError({ statusCode: 400, message: 'ID заявки обязателен' })
  }

  const body = await readBody(event)
  const { status } = body

  if (!status || !['new', 'processing', 'completed', 'rejected'].includes(status)) {
    throw createError({ statusCode: 400, message: 'Некорректный статус' })
  }

  const supabase = useSupabaseAdmin(event)

  // Подготавливаем данные для обновления
  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  }

  // Если статус меняется на processing/completed/rejected — записываем кто обработал
  if (['processing', 'completed', 'rejected'].includes(status)) {
    updateData.processed_by = admin.id
    updateData.processed_at = new Date().toISOString()
  }

  const { data: callback, error } = await supabase
    .from('callback_requests')
    .update(updateData)
    .eq('id', callbackId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update callback:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении заявки',
    })
  }

  return {
    callback: {
      id: callback.id,
      name: callback.name,
      phone: callback.phone,
      status: callback.status,
      processedBy: callback.processed_by,
      processedAt: callback.processed_at,
      updatedAt: callback.updated_at,
    },
  }
})
