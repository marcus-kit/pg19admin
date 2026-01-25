/**
 * Утилиты для работы с OpenAI API
 */

/**
 * Генерирует embedding для текста с помощью OpenAI API.
 * TODO: Реализовать когда будет настроен OpenAI API
 *
 * @param text Текст для генерации embedding
 * @returns Вектор embedding или null если API не настроен
 */
export async function generateEmbedding(_text: string): Promise<number[] | null> {
  // TODO: Реализовать после настройки OpenAI API
  // const config = useRuntimeConfig()
  // if (!config.openaiApiKey) return null
  //
  // const openai = new OpenAI({ apiKey: config.openaiApiKey })
  // const response = await openai.embeddings.create({
  //   model: 'text-embedding-ada-002',
  //   input: text,
  // })
  // return response.data[0].embedding

  console.warn('generateEmbedding: OpenAI API not configured, skipping embedding generation')
  return null
}
