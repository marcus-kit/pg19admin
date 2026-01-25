import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  // Проверка авторизации и прав

  const query = getQuery(event)

  const supabase = useSupabaseAdmin(event)

  // Строим запрос
  let queryBuilder = supabase
    .from('pages')
    .select('*')
    .order('sort_order', { ascending: true })

  // Фильтр по статусу публикации
  if (query.published === 'true') {
    queryBuilder = queryBuilder.eq('is_published', true)
  }
  else if (query.published === 'false') {
    queryBuilder = queryBuilder.eq('is_published', false)
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Failed to fetch pages:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке страниц',
    })
  }

  // Маппинг snake_case → camelCase
  const pages = (data || []).map((item: any) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    content: item.content,
    metaTitle: item.meta_title,
    metaDescription: item.meta_description,
    isPublished: item.is_published,
    sortOrder: item.sort_order,
    authorId: item.author_id,
    publishedAt: item.published_at,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))

  return { pages }
})
