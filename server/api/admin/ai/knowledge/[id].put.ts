/**
 * PUT /api/admin/ai/knowledge/[id]
 * Обновление записи базы знаний
 */

import { requirePermission } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'
// generateEmbedding auto-imported from base layer

interface UpdateKnowledgeRequest {
  category?: string
  question?: string
  answer?: string
  keywords?: string[]
  priority?: number
  isActive?: boolean
  regenerateEmbedding?: boolean
}

export default defineEventHandler(async (event) => {
  // Проверка авторизации и прав
  await requirePermission(event, 'ai:manage')

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID обязателен'
    })
  }

  const body = await readBody<UpdateKnowledgeRequest>(event)

  const supabase = useSupabaseAdmin(event)

  // Проверяем что запись существует
  const { data: existing, error: existingError } = await supabase
    .from('ai_knowledge_base')
    .select('id, question')
    .eq('id', id)
    .single()

  if (existingError || !existing) {
    throw createError({
      statusCode: 404,
      message: 'Запись не найдена'
    })
  }

  // Строим объект обновления
  const updateData: Record<string, unknown> = {}

  if (body.category !== undefined) {
    updateData.category = body.category?.trim() || null
  }

  if (body.question !== undefined) {
    if (!body.question.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Вопрос не может быть пустым'
      })
    }
    updateData.question = body.question.trim()
  }

  if (body.answer !== undefined) {
    if (!body.answer.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Ответ не может быть пустым'
      })
    }
    updateData.answer = body.answer.trim()
  }

  if (body.keywords !== undefined) {
    updateData.keywords = body.keywords.filter((k) => k.trim())
  }

  if (body.priority !== undefined) {
    updateData.priority = body.priority
  }

  if (body.isActive !== undefined) {
    updateData.is_active = body.isActive
  }

  // Перегенерируем embedding если вопрос изменился или запрошено явно
  const questionChanged = body.question && body.question.trim() !== existing.question
  if (questionChanged || body.regenerateEmbedding) {
    try {
      const questionText = (body.question?.trim() || existing.question)
      updateData.embedding = await generateEmbedding(questionText)
    } catch (embeddingError) {
      console.error('Failed to regenerate embedding:', embeddingError)
      // Не блокируем обновление — embedding можно сгенерировать позже
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Нечего обновлять'
    })
  }

  // Обновляем запись
  const { data: item, error } = await supabase
    .from('ai_knowledge_base')
    .update(updateData)
    .eq('id', id)
    .select('id, category, question, answer, keywords, priority, is_active, embedding, created_at, updated_at')
    .single()

  if (error) {
    console.error('Failed to update knowledge item:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении записи'
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
      updatedAt: item.updated_at
    }
  }
})
