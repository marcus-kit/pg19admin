/**
 * GET /api/admin/ai/stats
 * Статистика AI-бота
 */

import { requireAdmin } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  // Проверка авторизации и прав
  await requireAdmin(event)

  const query = getQuery(event)

  // Период: today, week, month, all
  const period = String(query.period || 'week')

  const supabase = useSupabaseAdmin(event)

  // Определяем временной фильтр
  let dateFilter: string | null = null
  const now = new Date()

  switch (period) {
    case 'today':
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      break
    case 'week':
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      break
    case 'month':
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      break
    default:
      dateFilter = null
  }

  // Общее количество сообщений бота
  let messagesQuery = supabase
    .from('ai_bot_messages')
    .select('*', { count: 'exact', head: true })

  if (dateFilter) {
    messagesQuery = messagesQuery.gte('created_at', dateFilter)
  }

  const { count: totalMessages } = await messagesQuery

  // Агрегированная статистика
  let statsQuery = supabase
    .from('ai_bot_messages')
    .select('prompt_tokens, completion_tokens, latency_ms')

  if (dateFilter) {
    statsQuery = statsQuery.gte('created_at', dateFilter)
  }

  const { data: statsData } = await statsQuery

  // Вычисляем агрегаты
  let totalPromptTokens = 0
  let totalCompletionTokens = 0
  let totalLatency = 0
  let latencyCount = 0

  for (const row of statsData || []) {
    totalPromptTokens += row.prompt_tokens || 0
    totalCompletionTokens += row.completion_tokens || 0
    if (row.latency_ms) {
      totalLatency += row.latency_ms
      latencyCount++
    }
  }

  const avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0
  const totalTokens = totalPromptTokens + totalCompletionTokens

  // Примерная стоимость (gpt-5-nano: $0.10/1M input, $0.40/1M output)
  const estimatedCost = (totalPromptTokens * 0.10 + totalCompletionTokens * 0.40) / 1_000_000

  // Количество эскалаций
  let escalationsQuery = supabase
    .from('chats')
    .select('*', { count: 'exact', head: true })
    .not('escalated_at', 'is', null)

  if (dateFilter) {
    escalationsQuery = escalationsQuery.gte('escalated_at', dateFilter)
  }

  const { count: totalEscalations } = await escalationsQuery

  // Количество чатов с ботом
  let botsChatsQuery = supabase
    .from('chats')
    .select('*', { count: 'exact', head: true })
    .gt('bot_message_count', 0)

  if (dateFilter) {
    botsChatsQuery = botsChatsQuery.gte('created_at', dateFilter)
  }

  const { count: totalBotChats } = await botsChatsQuery

  // Escalation rate
  const escalationRate = totalBotChats && totalBotChats > 0
    ? Math.round((totalEscalations || 0) / totalBotChats * 100)
    : 0

  // Количество записей в базе знаний
  const { count: knowledgeCount } = await supabase
    .from('ai_knowledge_base')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Статистика по моделям
  let modelStatsQuery = supabase
    .from('ai_bot_messages')
    .select('model')

  if (dateFilter) {
    modelStatsQuery = modelStatsQuery.gte('created_at', dateFilter)
  }

  const { data: modelData } = await modelStatsQuery

  const modelStats: Record<string, number> = {}
  for (const row of modelData || []) {
    modelStats[row.model] = (modelStats[row.model] || 0) + 1
  }

  // Причины эскалаций
  let escalationReasonsQuery = supabase
    .from('chats')
    .select('escalation_reason')
    .not('escalation_reason', 'is', null)

  if (dateFilter) {
    escalationReasonsQuery = escalationReasonsQuery.gte('escalated_at', dateFilter)
  }

  const { data: reasonsData } = await escalationReasonsQuery

  const escalationReasons: Record<string, number> = {}
  for (const row of reasonsData || []) {
    if (row.escalation_reason) {
      escalationReasons[row.escalation_reason] = (escalationReasons[row.escalation_reason] || 0) + 1
    }
  }

  return {
    stats: {
      period,
      messages: {
        total: totalMessages || 0,
        avgPerDay: period === 'week'
          ? Math.round((totalMessages || 0) / 7)
          : period === 'month'
            ? Math.round((totalMessages || 0) / 30)
            : totalMessages || 0
      },
      tokens: {
        prompt: totalPromptTokens,
        completion: totalCompletionTokens,
        total: totalTokens
      },
      latency: {
        average: avgLatency,
        unit: 'ms'
      },
      cost: {
        estimated: Math.round(estimatedCost * 100) / 100,
        currency: 'USD'
      },
      escalations: {
        total: totalEscalations || 0,
        rate: escalationRate,
        reasons: escalationReasons
      },
      chats: {
        withBot: totalBotChats || 0
      },
      knowledge: {
        activeItems: knowledgeCount || 0
      },
      models: modelStats
    }
  }
})
