<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════════════
// ИМПОРТЫ ТИПОВ
// ═══════════════════════════════════════════════════════════════════════════
import type { Chat, ChatMessage } from '~/types/admin'

// ═══════════════════════════════════════════════════════════════════════════
// ИМПОРТЫ
// ═══════════════════════════════════════════════════════════════════════════
import { getErrorStatusCode, formatFileSize, formatTime, formatRelativeDate } from '~/composables/useFormatters'
import { CHAT_STATUS, getStatusLabel, getStatusBadgeClass } from '~/composables/useStatusConfig'

// ═══════════════════════════════════════════════════════════════════════════
// МАКРОСЫ
// ═══════════════════════════════════════════════════════════════════════════
definePageMeta({
  middleware: 'admin',
})

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLES
// ═══════════════════════════════════════════════════════════════════════════
const route = useRoute()
const router = useRouter()
const toast = useToast()
const user = useSupabaseUser()
const supabase = useSupabaseClient()

useHead({ title: 'Чат — Админ-панель' })

// ═══════════════════════════════════════════════════════════════════════════
// РЕАКТИВНОЕ СОСТОЯНИЕ
// ═══════════════════════════════════════════════════════════════════════════

// Состояние страницы
const loading = ref(true)
const sending = ref(false)
const chat = ref<Chat | null>(null)
const messages = ref<ChatMessage[]>([])
const messagesContainer = ref<HTMLElement | null>(null)
const messageInputRef = ref<HTMLTextAreaElement | null>(null)
/** Показывать кнопку «Вниз», когда пользователь проскроллил вверх */
const showScrollToBottom = ref(false)

// Состояние для ввода сообщения
const newMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)
const pendingPreview = ref<string | null>(null)
/** Ошибка отправки: сообщение не ушло, показываем «Повторить» */
const sendFailed = ref(false)

// Константы для работы с файлами
const ACCEPT_FILES = 'image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx,.xls,.xlsx'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/** Шаблоны ответов для операторов */
const CHAT_TEMPLATES = [
  { id: 'greet', label: 'Приветствие', text: 'Здравствуйте! Чем могу помочь?' },
  { id: 'received', label: 'Принято', text: 'Принято в работу. Ожидайте ответа.' },
  { id: 'specialist', label: 'Передали специалисту', text: 'Ваш запрос передан специалисту. Ответим в ближайшее время.' },
  { id: 'clarify', label: 'Уточните', text: 'Уточните, пожалуйста, детали вашего вопроса.' },
  { id: 'thanks', label: 'Благодарность', text: 'Спасибо за обращение! Если возникнут вопросы — пишите.' },
]

const templatesOpen = ref(false)
const templatesRef = ref<HTMLElement | null>(null)
let templatesCloseHandler: ((e: MouseEvent) => void) | null = null

watch(templatesOpen, (open) => {
  if (templatesCloseHandler) {
    document.removeEventListener('click', templatesCloseHandler)
    templatesCloseHandler = null
  }
  if (!open) return
  templatesCloseHandler = (e: MouseEvent) => {
    const el = templatesRef.value
    if (el && !el.contains(e.target as Node)) {
      templatesOpen.value = false
    }
  }
  nextTick(() => document.addEventListener('click', templatesCloseHandler))
})

// Пагинация сообщений
const hasMoreMessages = ref(false)
const loadingMore = ref(false)
const SCROLL_LOAD_THRESHOLD = 80

// Подсветка новых сообщений от пользователя
const unreadMessageIds = ref<Set<string>>(new Set())
const NEW_MESSAGE_TITLE = 'Новое сообщение — ПЖ19'
let titleFlashTimeout: ReturnType<typeof setTimeout> | null = null

// Supabase Realtime подписка
let subscription: ReturnType<typeof supabase.channel> | null = null

// ═══════════════════════════════════════════════════════════════════════════
// COMPUTED
// ═══════════════════════════════════════════════════════════════════════════

const chatId = computed(() => route.params.id as string)

/** Группировка сообщений по дате для отображения разделителей */
const groupedMessages = computed(() => {
  const groups: { date: string, messages: ChatMessage[] }[] = []
  let currentDate = ''

  for (const msg of messages.value) {
    const msgDate = new Date(msg.createdAt).toDateString()
    if (msgDate !== currentDate) {
      currentDate = msgDate
      groups.push({ date: msg.createdAt, messages: [] })
    }
    groups[groups.length - 1]!.messages.push(msg)
  }

  return groups
})

// ═══════════════════════════════════════════════════════════════════════════
// МЕТОДЫ
// ═══════════════════════════════════════════════════════════════════════════

/** Загрузка данных чата и сообщений */
async function fetchChat() {
  loading.value = true
  unreadMessageIds.value = new Set()
  try {
    const data = await $fetch<{ chat: Chat, messages: ChatMessage[], hasMore?: boolean }>(
      `/api/admin/chat/${chatId.value}`,
    )
    chat.value = data.chat
    messages.value = data.messages
    hasMoreMessages.value = data.hasMore ?? false

    if (data.chat.unreadAdminCount > 0) {
      await $fetch(`/api/admin/chat/${chatId.value}/read`, { method: 'POST' })
    }
  }
  catch (error: unknown) {
    toast.error('Не удалось загрузить чат')
    if (getErrorStatusCode(error) === 404) {
      router.push('/chat')
    }
  }
  finally {
    loading.value = false
    await nextTick()
    scrollToBottom()
    showScrollToBottom.value = false
    if (chat.value?.status !== 'closed') {
      setTimeout(() => messageInputRef.value?.focus(), 100)
    }
  }
}

/** Подгрузка старых сообщений при скролле вверх */
async function loadMoreMessages() {
  if (loadingMore.value || !hasMoreMessages.value || messages.value.length === 0) return
  const oldestCreatedAt = messages.value[0]!.createdAt
  loadingMore.value = true
  const prevScrollHeight = messagesContainer.value?.scrollHeight ?? 0
  const prevScrollTop = messagesContainer.value?.scrollTop ?? 0
  try {
    const data = await $fetch<{ messages: ChatMessage[], hasMore?: boolean }>(
      `/api/admin/chat/${chatId.value}`,
      { params: { before: oldestCreatedAt } },
    )
    hasMoreMessages.value = data.hasMore ?? false
    messages.value = [...data.messages, ...messages.value]
    await nextTick()
    if (messagesContainer.value) {
      const newScrollHeight = messagesContainer.value.scrollHeight
      messagesContainer.value.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop
    }
  }
  catch {
    toast.error('Не удалось загрузить сообщения')
  }
  finally {
    loadingMore.value = false
  }
}

/** Обработка скролла: подгрузка при достижении верха, видимость кнопки «Вниз» */
function onMessagesScroll() {
  if (!messagesContainer.value) return
  showScrollToBottom.value = !isScrolledToBottom()
  if (loadingMore.value || !hasMoreMessages.value) return
  if (messagesContainer.value.scrollTop < SCROLL_LOAD_THRESHOLD) {
    loadMoreMessages()
  }
  if (isScrolledToBottom()) {
    unreadMessageIds.value = new Set()
  }
}

function isScrolledToBottom(): boolean {
  if (!messagesContainer.value) return true
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  return scrollHeight - scrollTop - clientHeight < 50
}

/** Загрузка файла на сервер */
async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  return await $fetch<{
    url: string
    name: string
    size: number
    type: string
    isImage: boolean
  }>(`/api/admin/chat/${chatId.value}/upload`, {
    method: 'POST',
    body: formData,
  })
}

/** Отправка сообщения (с файлом или без). Возвращает true при успехе, false при ошибке. */
async function handleSendMessage(content: string, file: File | null): Promise<boolean> {
  if (sending.value) return false

  sending.value = true
  sendFailed.value = false
  try {
    let attachment: { url: string, name: string, size: number, isImage: boolean } | null = null
    if (file) {
      attachment = await uploadFile(file)
    }

    const response = await $fetch<{ message: ChatMessage }>(`/api/admin/chat/${chatId.value}/messages`, {
      method: 'POST',
      body: {
        content,
        contentType: attachment ? (attachment.isImage ? 'image' : 'file') : 'text',
        attachmentUrl: attachment?.url,
        attachmentName: attachment?.name,
        attachmentSize: attachment?.size,
      },
    })

    // Добавляем сообщение если его ещё нет (может прийти через realtime)
    if (!messages.value.some(m => m.id === response.message.id)) {
      messages.value.push(response.message)
    }

    await nextTick()
    scrollToBottom()
    return true
  }
  catch {
    toast.error('Ошибка при отправке. Сообщение сохранено, нажмите «Повторить» или отправьте снова.')
    sendFailed.value = true
    return false
  }
  finally {
    sending.value = false
  }
}

/** Закрытие чата */
async function handleClose() {
  if (!confirm('Закрыть этот чат?')) return

  try {
    await $fetch(`/api/admin/chat/${chatId.value}/close`, { method: 'POST' })
    if (chat.value) {
      chat.value.status = 'closed'
    }
  }
  catch {
    toast.error('Ошибка при закрытии чата')
  }
}

/** Назначение чата на текущего админа */
async function handleAssignToMe() {
  if (!user.value) return

  try {
    await $fetch(`/api/admin/chat/${chatId.value}/assign`, {
      method: 'POST',
      body: { adminId: user.value.sub },
    })
    await fetchChat()
  }
  catch {
    toast.error('Ошибка при назначении чата')
  }
}

/** Прокрутка к последнему сообщению */
function scrollToBottom() {
  if (!messagesContainer.value) return
  messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  showScrollToBottom.value = false
}

/** Инициалы клиента для аватарки */
function getChatInitials(c: Chat | null): string {
  if (!c) return '?'
  const name = (c.userName || c.guestName || '').trim()
  if (!name) return '?'
  const parts = name.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase().slice(0, 2)
  }
  return name.slice(0, 2).toUpperCase()
}

/** Метка даты для группировки сообщений (Сегодня/Вчера/дата) */
function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()

  if (date.toDateString() === now.toDateString()) {
    return 'Сегодня'
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Вчера'
  }

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

/** Проверяет, является ли вложение изображением */
function isImageAttachment(message: ChatMessage): boolean {
  if (!message.attachmentUrl) return false

  const imagePattern = /\.(jpg|jpeg|png|gif|webp)$/i
  return imagePattern.test(message.attachmentUrl)
    || (message.attachmentName ? imagePattern.test(message.attachmentName) : false)
}

/** Открытие диалога выбора файла */
function openFileDialog() {
  fileInput.value?.click()
}

/** Обработка выбора файла */
function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  input.value = ''

  if (file.size > MAX_FILE_SIZE) {
    toast.error('Размер файла не должен превышать 10 МБ')
    return
  }

  pendingFile.value = file

  // Создаём превью для изображений
  pendingPreview.value = file.type.startsWith('image/')
    ? URL.createObjectURL(file)
    : null
}

/** Удаление выбранного файла */
function removePendingFile() {
  pendingFile.value = null
  if (pendingPreview.value) {
    URL.revokeObjectURL(pendingPreview.value)
    pendingPreview.value = null
  }
}

/** Отправка формы (сообщение + файл). При ошибке сообщение не очищается. */
async function handleSubmit() {
  if (!newMessage.value.trim() && !pendingFile.value) return

  const ok = await handleSendMessage(newMessage.value.trim(), pendingFile.value)
  if (ok) {
    newMessage.value = ''
    removePendingFile()
  }
}

/** Enter без Shift — отправить, Shift+Enter — новая строка */
function onMessageKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}

/** Вставка шаблона в поле ввода и закрытие меню */
function insertTemplate(template: { text: string }) {
  const text = template.text.trim()
  if (!text) return
  newMessage.value = newMessage.value ? `${newMessage.value}\n${text}` : text
  templatesOpen.value = false
}

/** Копирование текста сообщения в буфер */
async function copyMessageText(msg: ChatMessage) {
  const parts: string[] = []
  if (msg.content) parts.push(msg.content)
  if (msg.attachmentName) parts.push(`[Файл: ${msg.attachmentName}]`)
  const text = parts.join('\n')
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Скопировано')
  }
  catch {
    toast.error('Не удалось скопировать')
  }
}

/** Автоматическое изменение высоты textarea */
function handleTextareaInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  target.style.height = 'auto'
  target.style.height = Math.min(target.scrollHeight, 120) + 'px'
}

/** Настройка подписки на Supabase Realtime для получения новых сообщений */
function setupRealtime() {
  subscription = supabase
    .channel(`chat:${chatId.value}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_id=eq.${chatId.value}`,
      },
      (payload) => {
        // Типизация Supabase realtime payload для chat_messages
        const newMsg = payload.new as {
          id: string
          chat_id: string
          sender_type: string
          sender_id: string | null
          sender_name: string | null
          content: string
          attachment_url: string | null
          attachment_name: string | null
          attachment_size: number | null
          is_read: boolean
          created_at: string
        }

        // Добавляем только если сообщения ещё нет
        if (messages.value.some(m => m.id === newMsg.id)) return

        messages.value.push({
          id: newMsg.id,
          chatId: newMsg.chat_id,
          senderType: newMsg.sender_type as ChatMessage['senderType'],
          senderId: newMsg.sender_id,
          senderName: newMsg.sender_name,
          content: newMsg.content,
          attachmentUrl: newMsg.attachment_url,
          attachmentName: newMsg.attachment_name,
          attachmentSize: newMsg.attachment_size,
          isRead: newMsg.is_read,
          createdAt: newMsg.created_at,
        })
        nextTick(() => scrollToBottom())

        if (newMsg.sender_type === 'user') {
          $fetch(`/api/admin/chat/${chatId.value}/read`, { method: 'POST' })
          unreadMessageIds.value = new Set([...unreadMessageIds.value, newMsg.id])
          const prevTitle = document.title
          document.title = `(1) ${NEW_MESSAGE_TITLE}`
          if (titleFlashTimeout) clearTimeout(titleFlashTimeout)
          titleFlashTimeout = setTimeout(() => {
            document.title = prevTitle
            titleFlashTimeout = null
          }, 3000)
        }
      },
    )
    .subscribe()
}

// ═══════════════════════════════════════════════════════════════════════════
// LIFECYCLE HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/** Esc — закрыть меню шаблонов или вернуться к списку чатов */
function onPageKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (templatesOpen.value) {
    templatesOpen.value = false
  }
  else {
    router.push('/chat')
  }
}

onMounted(() => {
  fetchChat()
  setupRealtime()
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', onPageKeydown)
  }
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('keydown', onPageKeydown)
  }
  subscription?.unsubscribe()
  if (titleFlashTimeout) clearTimeout(titleFlashTimeout)
  if (pendingPreview.value) {
    URL.revokeObjectURL(pendingPreview.value)
  }
})
</script>

<template>
  <div class="chat-detail-page">
    <div class="chat-detail-page__main">
      <!-- Шапка: назад + аватар + имя + статус + действия -->
      <header v-if="chat" class="chat-detail-page__header">
        <div class="chat-detail-page__header-bg" aria-hidden="true" />
        <div class="chat-detail-page__header-inner">
          <button
            type="button"
            class="chat-detail-page__back"
            aria-label="К списку чатов"
            @click="router.push('/chat')"
          >
            <Icon name="heroicons:arrow-left" class="w-5 h-5" />
          </button>
          <div class="chat-detail-page__header-avatar">
            {{ getChatInitials(chat) }}
          </div>
          <div class="chat-detail-page__header-info">
            <h1 class="chat-detail-page__header-title">
              {{ chat.userName || chat.guestName || `Чат #${chat.id.slice(0, 8)}` }}
            </h1>
            <div class="chat-detail-page__header-meta">
              <UiBadge
                v-if="chat.guestName && !chat.userId"
                size="sm"
                class="chat-detail-page__guest-badge"
              >
                Гость
              </UiBadge>
              <UiBadge
                :class="getStatusBadgeClass(CHAT_STATUS, chat.status)"
                size="sm"
              >
                {{ getStatusLabel(CHAT_STATUS, chat.status) }}
              </UiBadge>
              <span v-if="chat.assignedAdmin" class="chat-detail-page__header-assigned">
                {{ chat.assignedAdmin.fullName }}
              </span>
            </div>
          </div>
          <div class="chat-detail-page__header-actions">
            <UiButton
              v-if="!chat.assignedAdmin && chat.status !== 'closed'"
              @click="handleAssignToMe"
              variant="secondary"
              size="sm"
            >
              <Icon name="heroicons:hand-raised" class="w-4 h-4" />
              Взять себе
            </UiButton>
            <button
              v-if="chat.status !== 'closed'"
              type="button"
              class="chat-detail-page__close-btn"
              title="Закрыть чат"
              @click="handleClose"
            >
              <Icon name="heroicons:x-circle" class="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      </header>

      <!-- Loading -->
      <UiLoading v-if="loading" class="chat-detail-page__loading" />

      <!-- Область сообщений -->
      <div
        v-else
        ref="messagesContainer"
        class="chat-detail-page__messages"
        role="log"
        aria-label="Сообщения чата"
        @scroll="onMessagesScroll"
      >
        <div v-if="loadingMore" class="chat-detail-page__loading-more">
          <span class="text-xs text-[var(--text-muted)]">Загрузка...</span>
        </div>
      <template v-for="group in groupedMessages" :key="group.date">
        <div class="chat-detail-page__date-sep">
          <span>{{ getDateLabel(group.date) }}</span>
        </div>

        <div class="chat-detail-page__day-messages">
          <div
            v-for="msg in group.messages"
            :key="msg.id"
            :class="[
              'chat-detail-page__row',
              msg.senderType === 'admin' || msg.senderType === 'bot'
                ? 'chat-detail-page__row--right'
                : msg.senderType === 'system'
                  ? 'chat-detail-page__row--center'
                  : 'chat-detail-page__row--left',
            ]"
          >
            <!-- System -->
            <div
              v-if="msg.senderType === 'system'"
              class="chat-detail-page__bubble chat-detail-page__bubble--system"
            >
              {{ msg.content }}
            </div>

            <!-- Bot -->
            <div
              v-else-if="msg.senderType === 'bot'"
              class="chat-detail-page__bubble chat-detail-page__bubble--bot group relative"
            >
              <div
                v-if="msg.content || msg.attachmentName"
                class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <button
                  type="button"
                  title="Копировать"
                  class="p-1.5 rounded-lg hover:bg-white/10"
                  @click.stop="copyMessageText(msg)"
                >
                  <Icon name="heroicons:document-duplicate" class="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              </div>
              <div class="flex items-center gap-1.5 mb-1">
                <Icon name="heroicons:cpu-chip" class="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span class="text-xs font-medium text-[#8B5CF6]">{{ msg.senderName || 'AI Ассистент' }}</span>
              </div>
              <p
                v-if="msg.content"
                class="whitespace-pre-wrap break-words text-[var(--text-primary)] pr-8"
              >
                {{ msg.content }}
              </p>
              <template v-if="msg.attachmentUrl">
                <a
                  v-if="isImageAttachment(msg)"
                  :href="msg.attachmentUrl"
                  target="_blank"
                  class="block mt-2"
                >
                  <img
                    :src="msg.attachmentUrl"
                    :alt="msg.attachmentName || 'Изображение'"
                    class="max-w-full max-h-48 rounded-lg hover:opacity-90 transition-opacity"
                  />
                </a>
                <a
                  v-else
                  :href="msg.attachmentUrl"
                  target="_blank"
                  class="mt-2 flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Icon name="heroicons:document" class="w-5 h-5 text-[#8B5CF6]" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm truncate">{{ msg.attachmentName }}</p>
                    <p class="text-xs text-[var(--text-muted)]">{{ formatFileSize(msg.attachmentSize) }}</p>
                  </div>
                  <Icon name="heroicons:arrow-down-tray" class="w-4 h-4 text-[var(--text-muted)]" />
                </a>
              </template>
              <div class="text-xs mt-1 text-[var(--text-muted)]">
                {{ formatTime(msg.createdAt) }}
              </div>
            </div>

            <!-- Admin -->
            <div
              v-else-if="msg.senderType === 'admin'"
              class="chat-detail-page__bubble chat-detail-page__bubble--admin group relative"
            >
              <div
                v-if="msg.content || msg.attachmentName"
                class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <button
                  type="button"
                  title="Копировать"
                  class="p-1.5 rounded-lg hover:bg-white/10"
                  @click.stop="copyMessageText(msg)"
                >
                  <Icon name="heroicons:document-duplicate" class="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              </div>
              <p
                v-if="msg.content"
                class="whitespace-pre-wrap break-words text-[var(--text-primary)] pr-8"
              >
                {{ msg.content }}
              </p>
              <template v-if="msg.attachmentUrl">
                <a
                  v-if="isImageAttachment(msg)"
                  :href="msg.attachmentUrl"
                  target="_blank"
                  class="block mt-2"
                >
                  <img
                    :src="msg.attachmentUrl"
                    :alt="msg.attachmentName || 'Изображение'"
                    class="max-w-full max-h-48 rounded-lg hover:opacity-90 transition-opacity"
                  />
                </a>
                <a
                  v-else
                  :href="msg.attachmentUrl"
                  target="_blank"
                  class="mt-2 flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Icon name="heroicons:document" class="w-5 h-5 text-primary" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm truncate">{{ msg.attachmentName }}</p>
                    <p class="text-xs text-[var(--text-muted)]">{{ formatFileSize(msg.attachmentSize) }}</p>
                  </div>
                  <Icon name="heroicons:arrow-down-tray" class="w-4 h-4 text-[var(--text-muted)]" />
                </a>
              </template>
              <div class="text-xs mt-1 text-[var(--text-muted)]">
                {{ formatTime(msg.createdAt) }}
                <span v-if="msg.senderName" class="ml-1 text-primary">
                  · {{ msg.senderName }}
                </span>
              </div>
            </div>

            <!-- User -->
            <div
              v-else
              class="chat-detail-page__bubble chat-detail-page__bubble--user group relative"
              :class="{ 'chat-detail-page__bubble--unread': unreadMessageIds.has(msg.id) }"
            >
              <div
                v-if="msg.content || msg.attachmentName"
                class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <button
                  type="button"
                  title="Копировать"
                  class="p-1.5 rounded-lg hover:bg-white/10"
                  @click.stop="copyMessageText(msg)"
                >
                  <Icon name="heroicons:document-duplicate" class="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              </div>
              <p v-if="msg.content" class="whitespace-pre-wrap break-words pr-8">
                {{ msg.content }}
              </p>
              <template v-if="msg.attachmentUrl">
                <a
                  v-if="isImageAttachment(msg)"
                  :href="msg.attachmentUrl"
                  target="_blank"
                  class="block mt-2"
                >
                  <img
                    :src="msg.attachmentUrl"
                    :alt="msg.attachmentName || 'Изображение'"
                    class="max-w-full max-h-48 rounded-lg hover:opacity-90 transition-opacity"
                  />
                </a>
                <a
                  v-else
                  :href="msg.attachmentUrl"
                  target="_blank"
                  class="mt-2 flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Icon name="heroicons:document" class="w-5 h-5 text-accent" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm truncate">{{ msg.attachmentName }}</p>
                    <p class="text-xs text-[var(--text-muted)]">{{ formatFileSize(msg.attachmentSize) }}</p>
                  </div>
                  <Icon name="heroicons:arrow-down-tray" class="w-4 h-4 text-[var(--text-muted)]" />
                </a>
              </template>
              <div class="text-xs mt-1 text-[var(--text-muted)]">
                {{ formatTime(msg.createdAt) }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-if="messages.length === 0" class="chat-detail-page__empty">
        <Icon name="heroicons:chat-bubble-left-right" class="chat-detail-page__empty-icon" />
        <p class="chat-detail-page__empty-text">Сообщений пока нет</p>
        <p class="chat-detail-page__empty-hint">Напишите первое сообщение или дождитесь ответа клиента</p>
      </div>

      <Transition name="fade">
        <button
          v-show="showScrollToBottom"
          type="button"
          class="chat-detail-page__scroll-down"
          aria-label="Прокрутить вниз"
          @click="scrollToBottom()"
        >
          <Icon name="heroicons:chevron-down" class="w-5 h-5" />
          Вниз
        </button>
      </Transition>
    </div>

    <!-- Панель ввода -->
    <div
      v-if="chat?.status !== 'closed'"
      class="chat-detail-page__input-area"
    >
      <div
        v-if="sendFailed"
        class="chat-detail-page__send-error"
      >
        <span class="text-red-400">Не удалось отправить. Сообщение сохранено.</span>
        <UiButton
          size="sm"
          variant="secondary"
          :disabled="sending"
          @click="handleSubmit()"
        >
          <Icon name="heroicons:arrow-path" class="w-4 h-4 mr-1" />
          Повторить
        </UiButton>
      </div>

      <div v-if="pendingFile" class="chat-detail-page__pending-file">
        <img
          v-if="pendingPreview"
          :src="pendingPreview"
          class="w-12 h-12 rounded object-cover flex-shrink-0"
        />
        <div
          v-else
          class="w-12 h-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0"
        >
          <Icon name="heroicons:document" class="w-6 h-6 text-primary" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm truncate text-[var(--text-primary)]">{{ pendingFile.name }}</p>
          <p class="text-xs text-[var(--text-muted)]">{{ formatFileSize(pendingFile.size) }}</p>
        </div>
        <button
          @click="removePendingFile"
          type="button"
          title="Удалить"
          class="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <Icon name="heroicons:x-mark" class="w-4 h-4 text-[var(--text-muted)]" />
        </button>
      </div>

      <!-- Hidden file input -->
      <input
        ref="fileInput"
        :accept="ACCEPT_FILES"
        @change="handleFileSelect"
        type="file"
        class="hidden"
      />

      <div ref="templatesRef" class="chat-detail-page__templates-wrap">
        <button
          type="button"
          class="chat-detail-page__templates-btn"
          @click.stop="templatesOpen = !templatesOpen"
        >
          <Icon name="heroicons:document-text" class="w-4 h-4" />
          Шаблоны
          <Icon :name="templatesOpen ? 'heroicons:chevron-up' : 'heroicons:chevron-down'" class="w-4 h-4" />
        </button>
        <div
          v-show="templatesOpen"
          class="chat-detail-page__templates-dropdown"
          @click.stop
        >
          <button
            v-for="t in CHAT_TEMPLATES"
            :key="t.id"
            type="button"
            class="chat-detail-page__template-item"
            @click="insertTemplate(t)"
          >
            <span class="font-medium">{{ t.label }}</span>
            <p class="text-xs text-[var(--text-muted)] truncate mt-0.5">{{ t.text }}</p>
          </button>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="chat-detail-page__input-bar">
        <button
          type="button"
          class="chat-detail-page__input-attach"
          :disabled="sending"
          title="Прикрепить файл"
          @click="openFileDialog"
        >
          <Icon name="heroicons:paper-clip" class="w-5 h-5" />
        </button>
        <textarea
          ref="messageInputRef"
          v-model="newMessage"
          :disabled="sending"
          placeholder="Сообщение..."
          rows="1"
          class="chat-detail-page__input-field"
          @keydown="onMessageKeydown"
          @input="handleTextareaInput"
        />
        <button
          type="submit"
          class="chat-detail-page__input-send"
          :disabled="(!newMessage.trim() && !pendingFile) || sending"
          :aria-busy="sending"
        >
          <Icon v-if="!sending" name="heroicons:paper-airplane" class="w-5 h-5" />
          <Icon v-else name="heroicons:arrow-path" class="w-5 h-5 animate-spin" />
        </button>
      </form>
    </div>

    <div v-else-if="chat" class="chat-detail-page__closed-notice">
      <Icon name="heroicons:lock-closed" class="w-5 h-5" />
      Чат закрыт
    </div>
    </div>

    <!-- Сайдбар: карточка клиента -->
    <aside v-if="chat && !loading" class="chat-detail-page__sidebar">
      <div class="chat-detail-page__sidebar-card">
        <h3 class="chat-detail-page__sidebar-title">Клиент</h3>
        <dl class="chat-detail-page__sidebar-list">
          <div class="chat-detail-page__sidebar-row">
            <dt>Имя</dt>
            <dd>{{ chat.userName || chat.guestName || '—' }}</dd>
          </div>
          <div v-if="chat.guestContact" class="chat-detail-page__sidebar-row">
            <dt>Контакт</dt>
            <dd class="break-all">{{ chat.guestContact }}</dd>
          </div>
          <div v-if="chat.userTelegramId" class="chat-detail-page__sidebar-row">
            <dt>Telegram</dt>
            <dd>{{ chat.userTelegramId }}</dd>
          </div>
          <div v-if="chat.subject" class="chat-detail-page__sidebar-row">
            <dt>Тема</dt>
            <dd class="truncate">{{ chat.subject }}</dd>
          </div>
          <div class="chat-detail-page__sidebar-row">
            <dt>Создан</dt>
            <dd>{{ formatRelativeDate(chat.createdAt) }}</dd>
          </div>
          <div v-if="chat.closedAt" class="chat-detail-page__sidebar-row">
            <dt>Закрыт</dt>
            <dd>{{ formatRelativeDate(chat.closedAt) }}</dd>
          </div>
        </dl>
        <NuxtLink
          v-if="chat.userId"
          :to="`/users/${chat.userId}`"
          class="chat-detail-page__sidebar-link"
        >
          <Icon name="heroicons:user-circle" class="w-4 h-4" />
          Карточка пользователя
        </NuxtLink>
      </div>
    </aside>
  </div>
</template>
