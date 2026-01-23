import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { requirePermission } from '~~/server/utils/adminAuth'

interface UpdateRequestBody {
  status?: 'new' | 'contacted' | 'approved' | 'rejected' | 'completed'
}

export default defineEventHandler(async (event) => {
  // Проверка прав
  await requirePermission(event, 'requests:update')

  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateRequestBody>(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный ID заявки'
    })
  }

  // Валидация статуса
  const validStatuses = ['new', 'contacted', 'approved', 'rejected', 'completed']
  if (body.status && !validStatuses.includes(body.status)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный статус'
    })
  }

  const supabase = useSupabaseAdmin()

  // Проверяем существование заявки
  const { data: existing, error: findError } = await supabase
    .from('connection_requests')
    .select('id')
    .eq('id', id)
    .single()

  if (findError || !existing) {
    throw createError({
      statusCode: 404,
      message: 'Заявка не найдена'
    })
  }

  // Обновляем
  const updateData: Record<string, any> = {}
  if (body.status) {
    updateData.status = body.status
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Нет данных для обновления'
    })
  }

  const { data, error } = await supabase
    .from('connection_requests')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update connection request:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении заявки'
    })
  }

  return {
    success: true,
    request: {
      id: data.id,
      status: data.status
    }
  }
})
