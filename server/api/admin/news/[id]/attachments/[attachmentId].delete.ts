import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'content:write')

  const newsId = getRouterParam(event, 'id')
  const attachmentId = getRouterParam(event, 'attachmentId')

  if (!newsId || !attachmentId) {
    throw createError({
      statusCode: 400,
      message: 'ID новости и вложения обязательны'
    })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Get attachment info
  const { data: attachment, error: fetchError } = await supabase
    .from('news_attachments')
    .select('id, storage_path, news_id')
    .eq('id', attachmentId)
    .eq('news_id', newsId)
    .single()

  if (fetchError || !attachment) {
    throw createError({
      statusCode: 404,
      message: 'Вложение не найдено'
    })
  }

  // Extract storage path from URL
  const storagePath = attachment.storage_path.split('/news-attachments/').pop()

  if (storagePath) {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('news-attachments')
      .remove([storagePath])

    if (storageError) {
      console.error('Error deleting from storage:', storageError)
      // Continue anyway to delete DB record
    }
  }

  // Delete attachment record
  const { error: deleteError } = await supabase
    .from('news_attachments')
    .delete()
    .eq('id', attachmentId)

  if (deleteError) {
    console.error('Error deleting attachment:', deleteError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при удалении вложения'
    })
  }

  return { success: true }
})
