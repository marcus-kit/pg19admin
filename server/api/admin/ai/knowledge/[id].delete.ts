/**
 * DELETE /api/admin/ai/knowledge/[id]
 * Удаление записи из базы знаний (soft delete — устанавливает is_active = false)
 */

import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  // Проверка авторизации и прав

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID обязателен'
    })
  }

  const query = getQuery(event)
  const hardDelete = query.hard === 'true'

  const supabase = useSupabaseAdmin(event)

  if (hardDelete) {
    // Полное удаление
    const { error } = await supabase
      .from('ai_knowledge_base')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to hard delete knowledge item:', error)
      throw createError({
        statusCode: 500,
        message: 'Ошибка при удалении записи'
      })
    }
  } else {
    // Soft delete — деактивация
    const { error } = await supabase
      .from('ai_knowledge_base')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Failed to soft delete knowledge item:', error)
      throw createError({
        statusCode: 500,
        message: 'Ошибка при деактивации записи'
      })
    }
  }

  return { success: true }
})
