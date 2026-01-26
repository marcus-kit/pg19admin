import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { requireParam } from '~~/server/utils/api-helpers'

// Тип для вложений новости
interface NewsAttachmentRow {
  id: number
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  sort_order: number
}

export default defineEventHandler(async (event) => {
  const id = requireParam(event, 'id', 'новости')
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
      status: newsItem.status,
      publishedAt: newsItem.published_at,
      expiresAt: newsItem.expires_at,
      isPinned: newsItem.is_pinned,
      authorId: newsItem.author_id,
      createdAt: newsItem.date_created,
      updatedAt: newsItem.date_updated,
      attachments: (newsItem.news_attachments || []).map((att: NewsAttachmentRow) => ({
        id: att.id,
        fileName: att.file_name,
        filePath: att.file_path,
        fileSize: att.file_size,
        mimeType: att.mime_type,
        sortOrder: att.sort_order,
      })),
    },
  }
})
