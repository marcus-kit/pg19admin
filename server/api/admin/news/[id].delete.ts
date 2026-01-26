import { useSupabaseAdmin } from '~~/server/utils/supabase'
import { requireParam, throwSupabaseError } from '~~/server/utils/api-helpers'

export default defineEventHandler(async (event) => {
  const id = requireParam(event, 'id', 'новости')
  const supabase = useSupabaseAdmin(event)

  // DELETE CASCADE автоматически удалит связанные news_attachments
  const { error } = await supabase
    .from('news')
    .delete()
    .eq('id', id)

  if (error) throwSupabaseError(error, 'удалении новости')

  return {
    success: true,
  }
})
