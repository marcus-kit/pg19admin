import { type DbNewsAttachmentInline, mapNewsAttachmentInline } from '~~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID новости обязателен',
    })
  }

  const supabase = await serverSupabaseClient(event)

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
    .eq('status', 'published')
    .single()

  if (newsError || !newsItem) {
    throw createError({
      statusCode: 404,
      message: 'Новость не найдена',
    })
  }

  return {
    news: {
      id: newsItem.id,
      title: newsItem.title,
      summary: newsItem.summary,
      content: newsItem.content,
      category: newsItem.category,
      publishedAt: newsItem.published_at,
      isPinned: newsItem.is_pinned,
      createdAt: newsItem.date_created,
      attachments: (newsItem.news_attachments || []).map((att: DbNewsAttachmentInline) => mapNewsAttachmentInline(att)),
    },
  }
})
