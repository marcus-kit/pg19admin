/**
 * GET /api/admin/ai/settings
 * Получение настроек AI-бота
 */

import { requireAdmin } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  // Проверка авторизации и прав
  await requireAdmin(event)

  const supabase = useSupabaseAdmin(event)

  // Получаем настройки (singleton)
  const { data: settings, error } = await supabase
    .from('ai_bot_settings')
    .select('*')
    .single()

  if (error) {
    console.error('Failed to fetch AI settings:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке настроек AI'
    })
  }

  // Маппинг snake_case → camelCase
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
