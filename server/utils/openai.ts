/**
 * Утилиты для работы с OpenAI API
 */

/**
 * Генерирует embedding для текста с помощью OpenAI API.
 * TODO: Реализовать когда будет настроен OpenAI API
 *
 * @param _text Текст для генерации embedding
 * @returns Вектор embedding или null если API не настроен
 */
export async function generateEmbedding(_text: string): Promise<number[] | null> {
  // TODO: Реализовать после настройки OpenAI API
  console.warn('generateEmbedding: OpenAI API not configured, skipping embedding generation')
  return null
}
