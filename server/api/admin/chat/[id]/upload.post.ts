import { serverSupabaseServiceRole } from '#supabase/server'

// Допустимые MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const chatId = getRouterParam(event, 'id')
  if (!chatId) {
    throw createError({
      statusCode: 400,
      message: 'ID чата обязателен'
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

  // Validate MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw createError({
      statusCode: 400,
      message: 'Недопустимый тип файла. Разрешены: изображения (JPEG, PNG, GIF, WebP), PDF, Word, Excel'
    })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Проверяем что чат существует
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('id, status')
    .eq('id', chatId)
    .single()

  if (chatError || !chat) {
    throw createError({
      statusCode: 404,
      message: 'Чат не найден'
    })
  }

  if (chat.status === 'closed') {
    throw createError({
      statusCode: 400,
      message: 'Чат закрыт'
    })
  }

  // Generate unique filename
  const timestamp = Date.now()
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `${chatId}/${timestamp}_${safeFileName}`

  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('chat-attachments')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false
    })

  if (uploadError) {
    console.error('Error uploading chat attachment:', uploadError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке файла'
    })
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(storagePath)

  return {
    url: urlData.publicUrl,
    name: file.name,
    size: file.size,
    type: file.type,
    isImage: file.type.startsWith('image/')
  }
})
