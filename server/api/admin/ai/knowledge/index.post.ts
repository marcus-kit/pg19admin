/**
 * POST /api/admin/ai/knowledge
 * Создание записи в базе знаний с генерацией embedding
 */

import { getAdminFromEvent, useSupabaseAdmin } from '~~/server/utils/supabase'
import { generateEmbedding } from '~~/server/utils/openai'

interface CreateKnowledgeRequest {
  category?: string
  question: string
  answer: string
  keywords?: string[]
  priority?: number
  isActive?: boolean
}

export default defineEventHandler(async (event) => {
  const admin = await getAdminFromEvent(event)
  const body = await readBody<CreateKnowledgeRequest>(event)

  // Валидация
  if (!body.question?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Вопрос обязателен',
    })
  }

  if (!body.answer?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Ответ обязателен',
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Генерируем embedding для вопроса
  let embedding: number[] | null = null
  try {
    embedding = await generateEmbedding(body.question.trim())
  }
  catch (embeddingError) {
    console.error('Failed to generate embedding:', embeddingError)
    // Продолжаем без embedding — можно сгенерировать позже
  }

  // Создаём запись
  const { data: item, error } = await supabase
    .from('ai_knowledge_base')
    .insert({
      category: body.category?.trim() || null,
      question: body.question.trim(),
      answer: body.answer.trim(),
      keywords: body.keywords?.filter(k => k.trim()) || [],
      priority: body.priority ?? 0,
      is_active: body.isActive ?? true,
      embedding,
      created_by: admin.id,
    })
    .select('id, category, question, answer, keywords, priority, is_active, created_at, updated_at')
    .single()

  if (error) {
    console.error('Failed to create knowledge item:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при создании записи',
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
      hasEmbedding: embedding !== null,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    },
  }
})
