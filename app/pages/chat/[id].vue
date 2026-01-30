<script setup lang="ts">
// ═══════════════════════════════════════════════════════════════════════════
// ИМПОРТЫ ТИПОВ
// ═══════════════════════════════════════════════════════════════════════════
import type { Chat, ChatMessage } from '~/types/admin'

// ═══════════════════════════════════════════════════════════════════════════
// ИМПОРТЫ
// ═══════════════════════════════════════════════════════════════════════════
import { getErrorStatusCode, formatFileSize, formatTime } from '~/composables/useFormatters'

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
const currentAdminName = ref<string | null>(null)

// Состояние для ввода сообщения
const newMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)
const pendingPreview = ref<string | null>(null)

// Состояние для редактирования сообщения
const editingMessageId = ref<string | null>(null)
const editingMessageContent = ref('')

// Состояние для контекстного меню
const contextMenu = ref<{
  messageId: string
  x: number
  y: number
} | null>(null)

// Константы для работы с файлами
const ACCEPT_FILES = 'image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx,.xls,.xlsx'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

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

/** Получить отображаемое имя чата */
function getChatDisplayName(): string {
  if (!chat.value) return ''
  
  // Приоритет: ФИО из личного кабинета
  if (chat.value.userFirstName || chat.value.userLastName) {
    return `${chat.value.userLastName || ''} ${chat.value.userFirstName || ''}`.trim()
  }
  // Затем userName из чата
  if (chat.value.userName) {
    return chat.value.userName
  }
  // Затем guestName из чата
  if (chat.value.guestName) {
    return chat.value.guestName
  }
  
  // Если ничего нет, используем ID чата
  return `Чат #${chat.value.id}`
}

/** Проверяет, является ли чат из личного кабинета */
function isPersonalCabinetChat(): boolean {
  return !!chat.value?.userId
}

/** Получить отображаемое имя отправителя сообщения */
function getSenderDisplayName(msg: ChatMessage): string {
  // Если это сообщение от пользователя, используем данные из чата
  if (msg.senderType === 'user' && chat.value) {
    // Приоритет: ФИО из личного кабинета
    if (chat.value.userFirstName || chat.value.userLastName) {
      return `${chat.value.userLastName || ''} ${chat.value.userFirstName || ''}`.trim()
    }
    // Затем userName из чата
    if (chat.value.userName) {
      return chat.value.userName
    }
    // Затем guestName из чата
    if (chat.value.guestName) {
      return chat.value.guestName
    }
  }
  
  // Используем senderName из сообщения, если есть
  if (msg.senderName) {
    return msg.senderName
  }
  
  // Если ничего нет, используем ID чата
  return `Чат #${chat.value?.id || msg.chatId}`
}

// ═══════════════════════════════════════════════════════════════════════════
// МЕТОДЫ
// ═══════════════════════════════════════════════════════════════════════════

/** Загрузка данных чата и сообщений */
async function fetchChat() {
  loading.value = true
  try {
    // Загружаем данные текущего админа
    try {
      const adminData = await $fetch<{ admin: { fullName: string } }>('/api/admin/auth/me')
      currentAdminName.value = adminData.admin.fullName
    }
    catch {
      // Игнорируем ошибку, если не удалось загрузить
    }

    const data = await $fetch<{ chat: Chat, messages: ChatMessage[] }>(`/api/admin/chat/${chatId.value}`)
    chat.value = data.chat
    messages.value = data.messages

    // Помечаем сообщения как прочитанные
    if (data.chat.unreadAdminCount > 0) {
      await $fetch(`/api/admin/chat/${chatId.value}/read`, { method: 'POST' })
    }

    await nextTick()
    scrollToBottom()
  }
  catch (error: unknown) {
    toast.error('Не удалось загрузить чат')
    if (getErrorStatusCode(error) === 404) {
      router.push('/chat')
    }
  }
  finally {
    loading.value = false
  }
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

/** Начать редактирование сообщения */
function startEditing(msg: ChatMessage) {
  editingMessageId.value = msg.id
  editingMessageContent.value = msg.content
  newMessage.value = msg.content
  // Прокручиваем к полю ввода
  nextTick(() => {
    const textarea = document.querySelector('textarea')
    textarea?.focus()
    textarea?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  })
}

/** Отменить редактирование */
function cancelEditing() {
  editingMessageId.value = null
  editingMessageContent.value = ''
  newMessage.value = ''
}

/** Сохранить отредактированное сообщение */
async function saveEditedMessage() {
  if (!editingMessageId.value || !newMessage.value.trim()) return

  sending.value = true
  try {
    const response = await $fetch<{ message: ChatMessage }>(
      `/api/admin/chat/${chatId.value}/messages/${editingMessageId.value}`,
      {
        method: 'PUT',
        body: {
          content: newMessage.value.trim(),
        },
      },
    )

    // Обновляем сообщение в списке
    const index = messages.value.findIndex(m => m.id === editingMessageId.value)
    if (index !== -1) {
      messages.value[index] = response.message
    }

    cancelEditing()
    toast.success('Сообщение обновлено')
  }
  catch {
    toast.error('Ошибка при обновлении сообщения')
  }
  finally {
    sending.value = false
  }
}

/** Удалить сообщение */
async function deleteMessage(messageId: string) {
  if (!confirm('Удалить это сообщение?')) return

  try {
    await $fetch(`/api/admin/chat/${chatId.value}/messages/${messageId}`, {
      method: 'DELETE',
    })

    // Удаляем сообщение из списка
    const index = messages.value.findIndex(m => m.id === messageId)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }

    toast.success('Сообщение удалено')
  }
  catch {
    toast.error('Ошибка при удалении сообщения')
  }
  finally {
    contextMenu.value = null
  }
}

/** Показать контекстное меню */
function showContextMenu(event: MouseEvent, message: ChatMessage) {
  // Показываем только для сообщений админа текущего пользователя
  if (message.senderType !== 'admin' || message.senderName !== currentAdminName.value) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  contextMenu.value = {
    messageId: message.id,
    x: event.clientX,
    y: event.clientY,
  }
}

/** Закрыть контекстное меню */
function closeContextMenu() {
  contextMenu.value = null
}

/** Обработчик редактирования из контекстного меню */
function handleContextEdit() {
  if (!contextMenu.value) return
  const message = messages.value.find(m => m.id === contextMenu.value!.messageId)
  if (message) {
    startEditing(message)
  }
  closeContextMenu()
}

/** Обработчик удаления из контекстного меню */
function handleContextDelete() {
  if (!contextMenu.value) return
  deleteMessage(contextMenu.value.messageId)
}

/** Отправка сообщения (с файлом или без) */
async function handleSendMessage(content: string, file: File | null) {
  if (sending.value) return

  // Если редактируем сообщение, сохраняем изменения
  if (editingMessageId.value) {
    editingMessageContent.value = content
    await saveEditedMessage()
    return
  }

  sending.value = true
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
  }
  catch {
    toast.error('Ошибка при отправке сообщения')
  }
  finally {
    sending.value = false
  }
}

/** Закрытие чата */
async function handleClose() {
  try {
    await $fetch(`/api/admin/chat/${chatId.value}/close`, { method: 'POST' })
    if (chat.value) {
      chat.value.status = 'closed'
    }
    toast.success('Чат закрыт')
    // Перезагружаем чат для получения системного сообщения
    await fetchChat()
  }
  catch {
    toast.error('Ошибка при закрытии чата')
  }
}

/** Открытие чата */
async function handleOpen() {
  try {
    await $fetch(`/api/admin/chat/${chatId.value}/open`, { method: 'POST' })
    if (chat.value) {
      chat.value.status = 'active'
    }
    toast.success('Чат открыт')
    // Перезагружаем чат для получения системного сообщения
    await fetchChat()
  }
  catch {
    toast.error('Ошибка при открытии чата')
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

/** Отправка формы (сообщение + файл) */
function handleSubmit() {
  if (!newMessage.value.trim() && !pendingFile.value) return

  handleSendMessage(newMessage.value.trim(), pendingFile.value)
  newMessage.value = ''
  removePendingFile()
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

        // Помечаем как прочитанное если от пользователя
        if (newMsg.sender_type === 'user') {
          $fetch(`/api/admin/chat/${chatId.value}/read`, { method: 'POST' })
        }
      },
    )
    .subscribe()
}

// ═══════════════════════════════════════════════════════════════════════════
// LIFECYCLE HOOKS
// ═══════════════════════════════════════════════════════════════════════════

onMounted(() => {
  fetchChat()
  setupRealtime()
  
  // Закрываем контекстное меню при клике вне его
  document.addEventListener('click', closeContextMenu)
  document.addEventListener('contextmenu', closeContextMenu)
})

onUnmounted(() => {
  subscription?.unsubscribe()
  if (pendingPreview.value) {
    URL.revokeObjectURL(pendingPreview.value)
  }
  
  document.removeEventListener('click', closeContextMenu)
  document.removeEventListener('contextmenu', closeContextMenu)
})
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-120px)]">
    <!-- Header -->
    <div
      v-if="chat"
      class="flex items-center justify-between gap-4 pb-2 border-b border-[var(--glass-border)]"
    >
      <div class="flex items-center gap-3">
        <UiButton
          @click="router.push('/chat')"
          variant="ghost"
          size="sm"
        >
          <Icon name="heroicons:arrow-left" class="w-5 h-5" />
        </UiButton>
        <div>
          <div class="flex items-center gap-2">
            <NuxtLink
              v-if="isPersonalCabinetChat() && chat.userId"
              :to="`/users/${chat.userId}?from=chat&chatId=${chat.id}`"
              class="text-lg font-semibold text-[var(--text-primary)] hover:text-primary transition-colors cursor-pointer"
            >
              {{ getChatDisplayName() }}
            </NuxtLink>
            <h1
              v-else
              class="text-lg font-semibold text-[var(--text-primary)]"
            >
              {{ getChatDisplayName() }}
            </h1>
            <UiBadge
              v-if="isPersonalCabinetChat()"
              size="sm"
              class="bg-blue-500/20 text-blue-400"
            >
              Личный кабинет
            </UiBadge>
            <UiBadge
              v-else-if="chat.guestName"
              size="sm"
              class="bg-purple-500/20 text-purple-400"
            >
              Гость
            </UiBadge>
          </div>
          <div class="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span v-if="chat.guestContact">
              {{ chat.guestContact }}
            </span>
            <span v-if="chat.userTelegramId">
              Telegram: {{ chat.userTelegramId }}
            </span>
            <span v-if="chat.assignedAdmin">
              · {{ chat.assignedAdmin.fullName }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex gap-2">
        <UiButton
          v-if="!chat.assignedAdmin && chat.status !== 'closed'"
          @click="handleAssignToMe"
          variant="secondary"
          size="sm"
        >
          <Icon name="heroicons:hand-raised" class="w-4 h-4" />
          Взять себе
        </UiButton>
        <UiButton
          v-if="chat.status !== 'closed'"
          @click="handleClose"
          variant="ghost"
          size="sm"
        >
          <Icon name="heroicons:x-circle" class="w-4 h-4 text-red-400" />
          Закрыть
        </UiButton>
      </div>
    </div>

    <!-- Loading -->
    <UiLoading v-if="loading" class="flex-1" />

    <!-- Messages -->
    <div
      v-else
      ref="messagesContainer"
      class="flex-1 overflow-y-auto py-2 space-y-3"
    >
      <template v-for="group in groupedMessages" :key="group.date">
        <!-- Date Separator -->
        <div class="flex items-center gap-2">
          <div class="flex-1 h-px bg-[var(--glass-border)]" />
          <span class="text-xs text-[var(--text-muted)] px-2">
            {{ getDateLabel(group.date) }}
          </span>
          <div class="flex-1 h-px bg-[var(--glass-border)]" />
        </div>

        <!-- Messages for this date -->
        <div class="space-y-1.5">
          <div
            v-for="msg in group.messages"
            :key="msg.id"
            :class="[
              'flex',
              msg.senderType === 'admin' || msg.senderType === 'bot'
                ? 'justify-end'
                : msg.senderType === 'system'
                  ? 'justify-center'
                  : 'justify-start',
            ]"
          >
            <!-- System Message -->
            <div
              v-if="msg.senderType === 'system'"
              class="px-3 py-1 text-xs text-[var(--text-muted)] bg-[var(--glass-bg)] rounded-full"
            >
              {{ msg.content }}
            </div>

            <!-- Bot Message -->
            <div
              v-else-if="msg.senderType === 'bot'"
              class="max-w-[70%] rounded-2xl px-4 py-2 glass-card rounded-br-md border-l-2 border-[#8B5CF6]/50"
            >
              <div class="flex items-center gap-1.5 mb-1">
                <Icon name="heroicons:cpu-chip" class="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span class="text-xs font-medium text-[#8B5CF6]">{{ msg.senderName || 'AI Ассистент' }}</span>
              </div>
              <p
                v-if="msg.content"
                class="whitespace-pre-wrap break-words text-[var(--text-primary)]"
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

            <!-- Admin Message -->
            <div
              v-else-if="msg.senderType === 'admin'"
              :data-message-id="msg.id"
              class="max-w-[70%] rounded-2xl px-4 py-2 glass-card rounded-br-md border-l-2 border-primary/50 group relative"
              :class="{ 'ring-2 ring-primary/30': editingMessageId === msg.id }"
              @contextmenu="showContextMenu($event, msg)"
            >
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-1.5">
                  <Icon name="heroicons:user-circle" class="w-3.5 h-3.5 text-primary" />
                  <span class="text-xs font-medium text-primary">{{ msg.senderName || 'Администратор' }}</span>
                </div>
                <button
                  v-if="!editingMessageId && msg.senderName === currentAdminName"
                  @click.stop="startEditing(msg)"
                  class="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
                  title="Редактировать"
                >
                  <Icon name="heroicons:pencil" class="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>
              </div>
              <p
                v-if="msg.content"
                class="whitespace-pre-wrap break-words text-[var(--text-primary)]"
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
              </div>
            </div>

            <!-- User Message -->
            <div
              v-else
              class="max-w-[70%] rounded-2xl px-4 py-2 glass-card rounded-bl-md"
            >
              <div class="flex items-center gap-1.5 mb-1">
                <Icon name="heroicons:user" class="w-3.5 h-3.5 text-accent" />
                <span class="text-xs font-medium text-accent">{{ getSenderDisplayName(msg) }}</span>
              </div>
              <p v-if="msg.content" class="whitespace-pre-wrap break-words">
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
              <div class="text-xs mt-1 text-[var(--text-muted)] text-right">
                {{ formatTime(msg.createdAt) }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <div
        v-if="messages.length === 0"
        class="flex-1 flex items-center justify-center"
      >
        <p class="text-[var(--text-muted)]">Сообщений пока нет</p>
      </div>
    </div>

    <!-- Input -->
    <div
      v-if="chat?.status !== 'closed'"
      class="pt-2 border-t border-[var(--glass-border)]"
    >
      <!-- Pending file preview -->
      <div
        v-if="pendingFile"
        class="mb-2 p-2 rounded-lg bg-white/5 flex items-center gap-2"
      >
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

      <!-- Режим редактирования -->
      <div
        v-if="editingMessageId"
        class="mb-2 p-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <Icon name="heroicons:pencil" class="w-4 h-4 text-primary" />
          <span class="text-sm text-primary font-medium">Редактирование сообщения</span>
        </div>
        <button
          @click="cancelEditing"
          class="p-1 rounded hover:bg-white/10 transition-colors"
          title="Отменить"
        >
          <Icon name="heroicons:x-mark" class="w-4 h-4 text-[var(--text-muted)]" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="flex gap-2 items-start">
        <!-- Attach button -->
        <UiButton
          v-if="!editingMessageId"
          :disabled="sending"
          @click="openFileDialog"
          type="button"
          variant="ghost"
          title="Прикрепить файл"
          class="flex-shrink-0 self-start"
        >
          <Icon name="heroicons:paper-clip" class="w-5 h-5" />
        </UiButton>

        <textarea
          v-model="newMessage"
          :disabled="sending"
          @keydown.enter.exact.prevent="handleSubmit"
          @keydown.escape="cancelEditing"
          @input="handleTextareaInput"
          :placeholder="editingMessageId ? 'Редактируйте сообщение...' : 'Введите сообщение...'"
          rows="1"
          class="flex-1 px-3 py-2 glass-card rounded-lg text-[var(--text-primary)] border border-[var(--glass-border)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-[var(--glass-bg)] resize-none min-h-[40px] max-h-[120px]"
        />

        <UiButton
          v-if="editingMessageId"
          :loading="sending"
          :disabled="!newMessage.trim() || sending"
          @click="saveEditedMessage"
          type="button"
          variant="secondary"
          class="flex-shrink-0 self-start"
        >
          <Icon name="heroicons:check" class="w-5 h-5" />
          Сохранить
        </UiButton>
        <UiButton
          v-else
          :loading="sending"
          :disabled="(!newMessage.trim() && !pendingFile) || sending"
          type="submit"
          class="flex-shrink-0 self-start"
        >
          <Icon name="heroicons:paper-airplane" class="w-5 h-5" />
        </UiButton>
      </form>
    </div>

    <!-- Closed Chat Notice -->
    <div
      v-else-if="chat"
      class="pt-2 border-t border-[var(--glass-border)] text-center space-y-3"
    >
      <div class="text-[var(--text-muted)]">
        <Icon name="heroicons:lock-closed" class="w-5 h-5 inline-block mr-1" />
        Чат закрыт
      </div>
      <UiButton
        @click="handleOpen"
        variant="secondary"
        size="sm"
      >
        <Icon name="heroicons:lock-open" class="w-4 h-4" />
        Открыть чат
      </UiButton>
    </div>

    <!-- Context Menu -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="contextMenu"
          :style="{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 1000,
          }"
          class="glass-card rounded-lg border border-[var(--glass-border)] shadow-lg py-1 min-w-[150px]"
          @click.stop
        >
          <button
            @click="handleContextEdit"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-colors"
          >
            <Icon name="heroicons:pencil" class="w-4 h-4" />
            Редактировать
          </button>
          <button
            @click="handleContextDelete"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Icon name="heroicons:trash" class="w-4 h-4" />
            Удалить
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
