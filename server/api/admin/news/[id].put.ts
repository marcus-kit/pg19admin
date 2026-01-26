import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { requireParam, throwSupabaseError } from '~~/server/utils/api-helpers'
import type { UpdateNewsData } from '~~/types/admin'

export default defineEventHandler(async (event) => {
  const id = requireParam(event, 'id', 'новости')
  const body = await readBody<UpdateNewsData>(event)
  const supabase = useSupabaseAdmin(event)

  // Маппинг camelCase -> snake_case
  const dbData: Record<string, unknown> = {}

  if (body.title !== undefined) dbData.title = body.title
  if (body.summary !== undefined) dbData.summary = body.summary
  if (body.content !== undefined) dbData.content = body.content
  if (body.category !== undefined) dbData.category = body.category
  if (body.status !== undefined) dbData.status = body.status
  if (body.publishedAt !== undefined) dbData.published_at = body.publishedAt
  if (body.expiresAt !== undefined) dbData.expires_at = body.expiresAt
  if (body.isPinned !== undefined) dbData.is_pinned = body.isPinned

  // Если меняется статус на published и publishedAt не указан, ставим текущее время
  if (body.status === 'published' && !body.publishedAt) {
    dbData.published_at = new Date().toISOString()
  }

  if (Object.keys(dbData).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Нет данных для обновления',
    })
  }

  const { data, error } = await supabase
    .from('news')
    .update(dbData)
    .eq('id', id)
    .select()
    .single()

  if (error) throwSupabaseError(error, 'обновлении новости')

  return {
    success: true,
    news: {
      id: data.id,
      title: data.title,
      status: data.status,
    },
  }
})
