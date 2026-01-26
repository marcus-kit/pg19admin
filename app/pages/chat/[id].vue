<script setup lang="ts">
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Chat, ChatMessage } from '~/types/admin'
import { getErrorStatusCode } from '~/composables/useFormatters'

definePageMeta({
  middleware: 'admin',
})

const route = useRoute()
const router = useRouter()
const chatId = computed(() => route.params.id as string)
const toast = useToast()
const user = useSupabaseUser()
const { formatFileSize } = useFormatters()

useHead({ title: 'Чат — Админ-панель' })

const loading = ref(true)
const sending = ref(false)
const chat = ref<Chat | null>(null)
const messages = ref<ChatMessage[]>([])
const messagesContainer = ref<HTMLElement | null>(null)

// ChatInput state
const newMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)
const pendingPreview = ref<string | null>(null)

const ACCEPT_FILES = 'image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx,.xls,.xlsx'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Supabase Realtime
const supabase = useSupabaseClient()
let subscription: RealtimeChannel | null = null

const fetchChat = async () => {
  loading.value = true
  try {
    const data = await $fetch<{ chat: Chat, messages: ChatMessage[] }>(`/api/admin/chat/${chatId.value}`)
    chat.value = data.chat
    messages.value = data.messages

    if (data.chat.unreadAdminCount > 0) {
      await $fetch(`/api/admin/chat/${chatId.value}/read`, { method: 'POST' })
    }

    await nextTick()
    scrollToBottom()
  }
  catch (error: unknown) {
    console.error('Failed to fetch chat:', error)
    toast.error('Не удалось загрузить чат')
    if (getErrorStatusCode(error) === 404) {
      router.push('/chat')
    }
  }
  finally {
    loading.value = false
  }
}

const uploadFile = async (file: File) => {
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

const handleSendMessage = async (content: string, file: File | null) => {
  if (sending.value) return

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

    if (!messages.value.some(m => m.id === response.message.id)) {
      messages.value.push(response.message)
    }

    await nextTick()
    scrollToBottom()
  }
  catch (error: unknown) {
    console.error('Failed to send message:', error)
    toast.error('Ошибка при отправке сообщения')
  }
  finally {
    sending.value = false
  }
}

const handleClose = async () => {
  if (!confirm('Закрыть этот чат?')) return

  try {
    await $fetch(`/api/admin/chat/${chatId.value}/close`, { method: 'POST' })
    if (chat.value) {
      chat.value.status = 'closed'
    }
  }
  catch (error: unknown) {
    console.error('Failed to close chat:', error)
    toast.error('Ошибка при закрытии чата')
  }
}

const handleAssignToMe = async () => {
  if (!user.value) return

  try {
    await $fetch(`/api/admin/chat/${chatId.value}/assign`, {
      method: 'POST',
      body: { adminId: user.value.sub },
    })
    await fetchChat()
  }
  catch (error: unknown) {
    console.error('Failed to assign chat:', error)
    toast.error('Ошибка при назначении чата')
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatDate = (dateStr: string) => {
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

const formatTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

const isImageAttachment = (message: ChatMessage): boolean => {
  if (!message.attachmentUrl) return false
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(message.attachmentUrl)
    || (message.attachmentName ? /\.(jpg|jpeg|png|gif|webp)$/i.test(message.attachmentName) : false)
}

// Группируем сообщения по дате
const groupedMessages = computed(() => {
  const groups: { date: string, messages: ChatMessage[] }[] = []
  let currentDate = ''

  for (const msg of messages.value) {
    const msgDate = new Date(msg.createdAt).toDateString()
    if (msgDate !== currentDate) {
      currentDate = msgDate
      groups.push({ date: msg.createdAt, messages: [] })
    }
    groups[groups.length - 1].messages.push(msg)
  }

  return groups
})

// ChatInput methods
const openFileDialog = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  input.value = ''

  if (file.size > MAX_FILE_SIZE) {
    alert('Размер файла не должен превышать 10 МБ')
    return
  }

  pendingFile.value = file

  if (file.type.startsWith('image/')) {
    pendingPreview.value = URL.createObjectURL(file)
  }
  else {
    pendingPreview.value = null
  }
}

const removePendingFile = () => {
  pendingFile.value = null
  if (pendingPreview.value) {
    URL.revokeObjectURL(pendingPreview.value)
    pendingPreview.value = null
  }
}

const handleSubmit = () => {
  if ((!newMessage.value.trim() && !pendingFile.value)) return

  handleSendMessage(newMessage.value.trim(), pendingFile.value)
  newMessage.value = ''
  removePendingFile()
}

const handleTextareaInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  target.style.height = 'auto'
  target.style.height = Math.min(target.scrollHeight, 120) + 'px'
}

// Подписка на Realtime
const setupRealtime = () => {
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
        if (!messages.value.some(m => m.id === newMsg.id)) {
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
          }
        }
      },
    )
    .subscribe()
}

onMounted(() => {
  fetchChat()
  setupRealtime()
})

onUnmounted(() => {
  if (subscription) {
    subscription.unsubscribe()
  }
  if (pendingPreview.value) {
    URL.revokeObjectURL(pendingPreview.value)
  }
})
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-120px)]">
    <!-- Header (бывший ChatDetailHeader) -->
    <div v-if="chat" class="flex items-center justify-between gap-4 pb-2 border-b border-[var(--glass-border)]">
      <div class="flex items-center gap-3">
        <UiButton variant="ghost" size="sm" @click="router.push('/chat')">
          <Icon name="heroicons:arrow-left" class="w-5 h-5" />
        </UiButton>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-lg font-semibold text-[var(--text-primary)]">
              {{ chat.userName || chat.guestName || `Чат #${chat.id}` }}
            </h1>
            <UiBadge v-if="chat.guestName && !chat.userId" class="bg-purple-500/20 text-purple-400" size="sm">
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
          variant="secondary"
          size="sm"
          @click="handleAssignToMe"
        >
          <Icon name="heroicons:hand-raised" class="w-4 h-4" />
          Взять себе
        </UiButton>
        <UiButton
          v-if="chat.status !== 'closed'"
          variant="ghost"
          size="sm"
          @click="handleClose"
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
          <div class="flex-1 h-px bg-[var(--glass-border)]"></div>
          <span class="text-xs text-[var(--text-muted)] px-2">
            {{ formatDate(group.date) }}
          </span>
          <div class="flex-1 h-px bg-[var(--glass-border)]"></div>
        </div>

        <!-- Messages for this date (бывший ChatMessageBubble) -->
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
              <p v-if="msg.content" class="whitespace-pre-wrap break-words text-[var(--text-primary)]">
                {{ msg.content }}
              </p>
              <template v-if="msg.attachmentUrl">
                <a v-if="isImageAttachment(msg)" :href="msg.attachmentUrl" target="_blank" class="block mt-2">
                  <img :src="msg.attachmentUrl" :alt="msg.attachmentName || 'Изображение'" class="max-w-full max-h-48 rounded-lg hover:opacity-90 transition-opacity" />
                </a>
                <a v-else :href="msg.attachmentUrl" target="_blank" class="mt-2 flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
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
              class="max-w-[70%] rounded-2xl px-4 py-2 glass-card rounded-br-md border-l-2 border-primary/50"
            >
              <p v-if="msg.content" class="whitespace-pre-wrap break-words text-[var(--text-primary)]">
                {{ msg.content }}
              </p>
              <template v-if="msg.attachmentUrl">
                <a v-if="isImageAttachment(msg)" :href="msg.attachmentUrl" target="_blank" class="block mt-2">
                  <img :src="msg.attachmentUrl" :alt="msg.attachmentName || 'Изображение'" class="max-w-full max-h-48 rounded-lg hover:opacity-90 transition-opacity" />
                </a>
                <a v-else :href="msg.attachmentUrl" target="_blank" class="mt-2 flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
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

            <!-- User Message -->
            <div
              v-else
              class="max-w-[70%] rounded-2xl px-4 py-2 glass-card rounded-bl-md"
            >
              <p v-if="msg.content" class="whitespace-pre-wrap break-words">
                {{ msg.content }}
              </p>
              <template v-if="msg.attachmentUrl">
                <a v-if="isImageAttachment(msg)" :href="msg.attachmentUrl" target="_blank" class="block mt-2">
                  <img :src="msg.attachmentUrl" :alt="msg.attachmentName || 'Изображение'" class="max-w-full max-h-48 rounded-lg hover:opacity-90 transition-opacity" />
                </a>
                <a v-else :href="msg.attachmentUrl" target="_blank" class="mt-2 flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
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

      <!-- Empty State -->
      <div v-if="messages.length === 0" class="flex-1 flex items-center justify-center">
        <p class="text-[var(--text-muted)]">Сообщений пока нет</p>
      </div>
    </div>

    <!-- Input (бывший ChatInput) -->
    <div v-if="chat?.status !== 'closed'" class="pt-2 border-t border-[var(--glass-border)]">
      <!-- Pending file preview -->
      <div v-if="pendingFile" class="mb-2 p-2 rounded-lg bg-white/5 flex items-center gap-2">
        <img
          v-if="pendingPreview"
          :src="pendingPreview"
          class="w-12 h-12 rounded object-cover flex-shrink-0"
        />
        <div v-else class="w-12 h-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon name="heroicons:document" class="w-6 h-6 text-primary" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm truncate text-[var(--text-primary)]">{{ pendingFile.name }}</p>
          <p class="text-xs text-[var(--text-muted)]">{{ formatFileSize(pendingFile.size) }}</p>
        </div>
        <button
          class="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          title="Удалить"
          @click="removePendingFile"
        >
          <Icon name="heroicons:x-mark" class="w-4 h-4 text-[var(--text-muted)]" />
        </button>
      </div>

      <!-- Hidden file input -->
      <input
        ref="fileInput"
        :accept="ACCEPT_FILES"
        type="file"
        class="hidden"
        @change="handleFileSelect"
      />

      <form class="flex gap-2" @submit.prevent="handleSubmit">
        <!-- Attach button -->
        <UiButton
          :disabled="sending"
          type="button"
          variant="ghost"
          title="Прикрепить файл"
          @click="openFileDialog"
        >
          <Icon name="heroicons:paper-clip" class="w-5 h-5" />
        </UiButton>

        <textarea
          v-model="newMessage"
          :disabled="sending"
          placeholder="Введите сообщение..."
          rows="1"
          class="flex-1 px-3 py-2 glass-card rounded-lg text-[var(--text-primary)] border border-[var(--glass-border)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-[var(--glass-bg)] resize-none min-h-[40px] max-h-[120px]"
          @keydown.enter.exact.prevent="handleSubmit"
          @input="handleTextareaInput"
        />

        <UiButton
          :loading="sending"
          :disabled="(!newMessage.trim() && !pendingFile) || sending"
          type="submit"
        >
          <Icon name="heroicons:paper-airplane" class="w-5 h-5" />
        </UiButton>
      </form>
    </div>

    <!-- Closed Chat Notice -->
    <div
      v-else-if="chat"
      class="pt-2 border-t border-[var(--glass-border)] text-center text-[var(--text-muted)]"
    >
      <Icon name="heroicons:lock-closed" class="w-5 h-5 inline-block mr-1" />
      Чат закрыт
    </div>
  </div>
</template>
