/**
 * GET /api/admin/ai/knowledge
 * Список записей базы знаний
 */

import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  // Проверка авторизации и прав

  const query = getQuery(event)

  const supabase = useSupabaseAdmin(event)

  // Строим запрос
  let queryBuilder = supabase
    .from('ai_knowledge_base')
    .select('id, category, question, answer, keywords, priority, is_active, created_at, updated_at')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  // Фильтр по категории
  if (query.category && query.category !== 'all') {
    queryBuilder = queryBuilder.eq('category', query.category)
  }

  // Фильтр по статусу (active/inactive/all)
  if (query.status === 'active') {
    queryBuilder = queryBuilder.eq('is_active', true)
  } else if (query.status === 'inactive') {
    queryBuilder = queryBuilder.eq('is_active', false)
  }
  // По умолчанию показываем все

  // Поиск по тексту
  if (query.search) {
    const searchTerm = String(query.search).toLowerCase()
    queryBuilder = queryBuilder.or(
      `question.ilike.%${searchTerm}%,answer.ilike.%${searchTerm}%`
    )
  }

  // Пагинация
  const limit = Math.min(Number(query.limit) || 50, 100)
  const offset = Number(query.offset) || 0
  queryBuilder = queryBuilder.range(offset, offset + limit - 1)

  const { data, error, count } = await queryBuilder

  if (error) {
    console.error('Failed to fetch knowledge base:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке базы знаний'
    })
  }

  // Маппинг snake_case → camelCase
  const items = (data || []).map((item: Record<string, unknown>) => ({
    id: item.id,
    category: item.category,
    question: item.question,
    answer: item.answer,
    keywords: item.keywords,
    priority: item.priority,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }))

  return {
    items,
    total: count || items.length
  }
})
