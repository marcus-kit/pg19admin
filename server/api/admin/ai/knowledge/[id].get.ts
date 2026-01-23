/**
 * GET /api/admin/ai/knowledge/[id]
 * Получение записи базы знаний по ID
 */

import { requirePermission } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  // Проверка авторизации и прав
  await requirePermission(event, 'ai:read')

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID обязателен'
    })
  }

  const supabase = useSupabaseAdmin(event)

  const { data: item, error } = await supabase
    .from('ai_knowledge_base')
    .select('id, category, question, answer, keywords, priority, is_active, embedding, created_at, updated_at, created_by')
    .eq('id', id)
    .single()

  if (error || !item) {
    throw createError({
      statusCode: 404,
      message: 'Запись не найдена'
    })
  }

  return {
    item: {
      id: item.id,
      category: item.category,
      question: item.question,
      answer: item.answer,
      keywords: item.keywords,
      priority: item.priority,
      isActive: item.is_active,
      hasEmbedding: item.embedding !== null,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      createdBy: item.created_by
    }
  }
})
