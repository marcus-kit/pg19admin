import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { requireParam, requireEntity, throwSupabaseError } from '~~/server/utils/api-helpers'

interface UpdateRequestBody {
  status?: 'new' | 'contacted' | 'approved' | 'rejected' | 'completed'
}

export default defineEventHandler(async (event) => {
  const id = requireParam(event, 'id', 'заявки')
  const body = await readBody<UpdateRequestBody>(event)
  const supabase = useSupabaseAdmin(event)

  // Валидация статуса
  const validStatuses = ['new', 'contacted', 'approved', 'rejected', 'completed']
  if (body.status && !validStatuses.includes(body.status)) {
    throw createError({
      statusCode: 400,
      message: 'Некорректный статус',
    })
  }

  // Проверяем существование заявки
  await requireEntity(supabase, 'connection_requests', id, 'Заявка')

  // Обновляем
  const updateData: {
    status?: 'new' | 'contacted' | 'approved' | 'rejected' | 'completed'
  } = {}
  if (body.status) {
    updateData.status = body.status
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Нет данных для обновления',
    })
  }

  const { data, error } = await supabase
    .from('connection_requests')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throwSupabaseError(error, 'обновлении заявки')

  return {
    success: true,
    request: {
      id: data.id,
      status: data.status,
    },
  }
})
