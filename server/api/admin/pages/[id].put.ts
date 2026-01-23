import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { requirePermission } from '~~/server/utils/adminAuth'

interface UpdatePageData {
  slug?: string
  title?: string
  content?: string
  metaTitle?: string
  metaDescription?: string
  isPublished?: boolean
  sortOrder?: number
}

export default defineEventHandler(async (event) => {
  // Проверка авторизации и прав
  await requirePermission(event, 'pages:update')

  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdatePageData>(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID страницы обязателен'
    })
  }

  const supabase = useSupabaseAdmin(event)

  // Получаем текущую страницу
  const { data: currentPage, error: fetchError } = await supabase
    .from('pages')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !currentPage) {
    throw createError({
      statusCode: 404,
      message: 'Страница не найдена'
    })
  }

  // Маппинг camelCase → snake_case
  const dbData: Record<string, unknown> = {}

  if (body.slug !== undefined) {
    // Нормализация slug
    const slug = body.slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    // Проверяем уникальность slug (если он изменился)
    if (slug !== currentPage.slug) {
      const { data: existing } = await supabase
        .from('pages')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single()

      if (existing) {
        throw createError({
          statusCode: 400,
          message: 'Страница с таким URL уже существует'
        })
      }
    }

    dbData.slug = slug
  }

  if (body.title !== undefined) dbData.title = body.title
  if (body.content !== undefined) dbData.content = body.content
  if (body.metaTitle !== undefined) dbData.meta_title = body.metaTitle
  if (body.metaDescription !== undefined) dbData.meta_description = body.metaDescription
  if (body.sortOrder !== undefined) dbData.sort_order = body.sortOrder

  // Обработка публикации
  if (body.isPublished !== undefined) {
    dbData.is_published = body.isPublished
    // Устанавливаем published_at при первой публикации
    if (body.isPublished && !currentPage.published_at) {
      dbData.published_at = new Date().toISOString()
    }
  }

  if (Object.keys(dbData).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Нет данных для обновления'
    })
  }

  const { data, error } = await supabase
    .from('pages')
    .update(dbData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update page:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении страницы'
    })
  }

  return {
    success: true,
    page: {
      id: data.id,
      slug: data.slug,
      title: data.title,
      isPublished: data.is_published
    }
  }
})
