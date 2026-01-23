import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { requireAdmin } from '~~/server/utils/adminAuth'

interface CreatePageData {
  slug: string
  title: string
  content: string
  metaTitle?: string
  metaDescription?: string
  isPublished?: boolean
  sortOrder?: number
}

export default defineEventHandler(async (event) => {
  // Проверка авторизации и прав
  const admin = await requireAdmin(event)

  const body = await readBody<CreatePageData>(event)

  // Валидация
  if (!body.slug || !body.slug.trim()) {
    throw createError({
      statusCode: 400,
      message: 'URL (slug) обязателен'
    })
  }

  if (!body.title || !body.title.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Заголовок обязателен'
    })
  }

  if (!body.content) {
    throw createError({
      statusCode: 400,
      message: 'Контент обязателен'
    })
  }

  // Нормализация slug (только латиница, цифры и дефисы)
  const slug = body.slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const supabase = useSupabaseAdmin(event)

  // Проверяем уникальность slug
  const { data: existing } = await supabase
    .from('pages')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    throw createError({
      statusCode: 400,
      message: 'Страница с таким URL уже существует'
    })
  }

  const publishedAt = body.isPublished ? new Date().toISOString() : null

  const { data, error } = await supabase
    .from('pages')
    .insert({
      slug,
      title: body.title,
      content: body.content,
      meta_title: body.metaTitle || null,
      meta_description: body.metaDescription || null,
      is_published: body.isPublished || false,
      sort_order: body.sortOrder || 0,
      author_id: admin.id,
      published_at: publishedAt
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create page:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при создании страницы'
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
