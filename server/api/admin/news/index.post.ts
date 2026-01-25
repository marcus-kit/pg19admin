import { getAdminFromEvent, useSupabaseAdmin } from '~~/server/utils/supabase'
import type { CreateNewsData } from '~~/types/admin'

export default defineEventHandler(async (event) => {
  const admin = await getAdminFromEvent(event)
  const body = await readBody<CreateNewsData>(event)

  if (!body.title || !body.content) {
    throw createError({
      statusCode: 400,
      message: 'Заголовок и контент обязательны',
    })
  }

  const authorId = admin.id
  const supabase = useSupabaseAdmin(event)

  // Если status = published и publishedAt не указан, ставим текущее время
  const publishedAt = body.status === 'published' && !body.publishedAt
    ? new Date().toISOString()
    : body.publishedAt

  const { data, error } = await supabase
    .from('news')
    .insert({
      title: body.title,
      summary: body.summary || null,
      content: body.content,
      category: body.category,
      status: body.status,
      published_at: publishedAt,
      expires_at: body.expiresAt || null,
      is_pinned: body.isPinned || false,
      author_id: authorId,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create news:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при создании новости',
    })
  }

  return {
    success: true,
    news: {
      id: data.id,
      title: data.title,
      status: data.status,
    },
  }
})
