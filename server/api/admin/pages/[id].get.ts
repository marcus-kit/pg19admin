import { useSupabaseAdmin } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  // Проверка авторизации и прав

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID страницы обязателен'
    })
  }

  const supabase = useSupabaseAdmin(event)

  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !page) {
    throw createError({
      statusCode: 404,
      message: 'Страница не найдена'
    })
  }

  return {
    page: {
      id: page.id,
      slug: page.slug,
      title: page.title,
      content: page.content,
      metaTitle: page.meta_title,
      metaDescription: page.meta_description,
      isPublished: page.is_published,
      sortOrder: page.sort_order,
      authorId: page.author_id,
      publishedAt: page.published_at,
      createdAt: page.created_at,
      updatedAt: page.updated_at
    }
  }
})
