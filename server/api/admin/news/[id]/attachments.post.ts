import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const newsId = getRouterParam(event, 'id')
  if (!newsId) {
    throw createError({
      statusCode: 400,
      message: 'ID новости обязателен'
    })
  }

  // Read multipart form data
  const formData = await readFormData(event)
  const file = formData.get('file') as File

  if (!file || !(file instanceof File)) {
    throw createError({
      statusCode: 400,
      message: 'Файл не загружен'
    })
  }

  // Validate file size (10 MB)
  if (file.size > 10 * 1024 * 1024) {
    throw createError({
      statusCode: 400,
      message: 'Размер файла не должен превышать 10 МБ'
    })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verify news exists
  const { data: news, error: newsError } = await supabase
    .from('news')
    .select('id')
    .eq('id', newsId)
    .single()

  if (newsError || !news) {
    throw createError({
      statusCode: 404,
      message: 'Новость не найдена'
    })
  }

  // Generate unique filename
  const timestamp = Date.now()
  const ext = file.name.split('.').pop() || 'bin'
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `${newsId}/${timestamp}_${safeFileName}`

  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('news-attachments')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false
    })

  if (uploadError) {
    console.error('Error uploading attachment:', uploadError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке файла'
    })
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('news-attachments')
    .getPublicUrl(storagePath)

  // Insert attachment record
  const { data: attachment, error: insertError } = await supabase
    .from('news_attachments')
    .insert({
      news_id: newsId,
      file_name: file.name,
      storage_path: urlData.publicUrl,
      mime_type: file.type
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error inserting attachment:', insertError)
    // Try to clean up uploaded file
    await supabase.storage.from('news-attachments').remove([storagePath])
    throw createError({
      statusCode: 500,
      message: 'Ошибка при сохранении вложения'
    })
  }

  return {
    success: true,
    attachment: {
      id: attachment.id,
      fileName: attachment.file_name,
      filePath: attachment.storage_path,
      mimeType: attachment.mime_type
    }
  }
})
