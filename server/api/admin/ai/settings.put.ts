/**
 * PUT /api/admin/ai/settings
 * Обновление настроек AI-бота
 */

import { requirePermission } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

interface UpdateSettingsRequest {
  isEnabled?: boolean
  operatorName?: string
  systemPrompt?: string
  model?: string
  maxTokens?: number
  escalationKeywords?: string[]
  maxBotMessages?: number
  ragEnabled?: boolean
  ragMatchThreshold?: number
  ragMatchCount?: number
}

export default defineEventHandler(async (event) => {
  // Проверка авторизации и прав
  await requirePermission(event, 'ai:manage')

  const body = await readBody<UpdateSettingsRequest>(event)

  const supabase = useSupabaseAdmin()

  // Строим объект обновления (только переданные поля)
  const updateData: Record<string, unknown> = {}

  if (body.isEnabled !== undefined) {
    updateData.is_enabled = body.isEnabled
  }

  if (body.operatorName !== undefined) {
    updateData.operator_name = body.operatorName.trim() || 'Оператор'
  }

  if (body.systemPrompt !== undefined) {
    if (!body.systemPrompt.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Системный промпт не может быть пустым'
      })
    }
    updateData.system_prompt = body.systemPrompt.trim()
  }

  if (body.model !== undefined) {
    const allowedModels = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5']
    if (!allowedModels.includes(body.model)) {
      throw createError({
        statusCode: 400,
        message: `Недопустимая модель. Разрешены: ${allowedModels.join(', ')}`
      })
    }
    updateData.model = body.model
  }

  if (body.maxTokens !== undefined) {
    if (body.maxTokens < 50 || body.maxTokens > 4000) {
      throw createError({
        statusCode: 400,
        message: 'maxTokens должен быть от 50 до 4000'
      })
    }
    updateData.max_tokens = body.maxTokens
  }

  if (body.escalationKeywords !== undefined) {
    if (!Array.isArray(body.escalationKeywords)) {
      throw createError({
        statusCode: 400,
        message: 'escalationKeywords должен быть массивом'
      })
    }
    updateData.escalation_keywords = body.escalationKeywords.filter((k) => k.trim())
  }

  if (body.maxBotMessages !== undefined) {
    if (body.maxBotMessages < 1 || body.maxBotMessages > 20) {
      throw createError({
        statusCode: 400,
        message: 'maxBotMessages должен быть от 1 до 20'
      })
    }
    updateData.max_bot_messages = body.maxBotMessages
  }

  if (body.ragEnabled !== undefined) {
    updateData.rag_enabled = body.ragEnabled
  }

  if (body.ragMatchThreshold !== undefined) {
    if (body.ragMatchThreshold < 0 || body.ragMatchThreshold > 1) {
      throw createError({
        statusCode: 400,
        message: 'ragMatchThreshold должен быть от 0 до 1'
      })
    }
    updateData.rag_match_threshold = body.ragMatchThreshold
  }

  if (body.ragMatchCount !== undefined) {
    if (body.ragMatchCount < 1 || body.ragMatchCount > 20) {
      throw createError({
        statusCode: 400,
        message: 'ragMatchCount должен быть от 1 до 20'
      })
    }
    updateData.rag_match_count = body.ragMatchCount
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Нечего обновлять'
    })
  }

  // Получаем ID существующих настроек (singleton)
  const { data: existing } = await supabase
    .from('ai_bot_settings')
    .select('id')
    .limit(1)
    .single()

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Настройки AI-бота не найдены'
    })
  }

  // Обновляем настройки по ID
  const { data: settings, error } = await supabase
    .from('ai_bot_settings')
    .update(updateData)
    .eq('id', existing.id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update AI settings:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении настроек AI'
    })
  }

  return {
    settings: {
      id: settings.id,
      isEnabled: settings.is_enabled,
      operatorName: settings.operator_name || 'Оператор',
      systemPrompt: settings.system_prompt,
      model: settings.model,
      maxTokens: settings.max_tokens,
      escalationKeywords: settings.escalation_keywords,
      maxBotMessages: settings.max_bot_messages,
      ragEnabled: settings.rag_enabled,
      ragMatchThreshold: Number(settings.rag_match_threshold),
      ragMatchCount: settings.rag_match_count,
      createdAt: settings.created_at,
      updatedAt: settings.updated_at
    }
  }
})
