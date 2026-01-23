import { requireAdmin } from '~~/server/utils/adminAuth'
import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  // Проверка авторизации и прав
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID новости обязателен'
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Получаем новость с вложениями
  const { data: newsItem, error: newsError } = await supabase
    .from('news')
    .select(`
      *,
      news_attachments (
        id,
        file_name,
        file_path,
        file_size,
        mime_type,
        sort_order
      )
    `)
    .eq('id', id)
    .single()

  if (newsError || !newsItem) {
    throw createError({
      statusCode: 404,
      message: 'Новость не найдена'
    })
  }

  return {
    news: {
      id: newsItem.id,
      title: newsItem.title,
      summary: newsItem.summary,
      content: newsItem.content,
      category: newsItem.category,
      status: newsItem.status,
      publishedAt: newsItem.published_at,
      expiresAt: newsItem.expires_at,
      isPinned: newsItem.is_pinned,
      authorId: newsItem.author_id,
      createdAt: newsItem.date_created,
      updatedAt: newsItem.date_updated,
      attachments: (newsItem.news_attachments || []).map((att: any) => ({
        id: att.id,
        fileName: att.file_name,
        filePath: att.file_path,
        fileSize: att.file_size,
        mimeType: att.mime_type,
        sortOrder: att.sort_order
      }))
    }
  }
})
