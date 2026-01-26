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

useHead({ title: 'Чат — Админ-панель' })

const loading = ref(true)
const sending = ref(false)
const chat = ref<Chat | null>(null)
const messages = ref<ChatMessage[]>([])
const messagesContainer = ref<HTMLElement | null>(null)

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
})
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-120px)]">
    <!-- Header -->
    <ChatDetailHeader
      v-if="chat"
      :chat="chat"
      @back="router.push('/chat')"
      @assign-to-me="handleAssignToMe"
      @close="handleClose"
    />

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

        <!-- Messages for this date -->
        <div class="space-y-1.5">
          <ChatMessageBubble
            v-for="msg in group.messages"
            :key="msg.id"
            :message="msg"
          />
        </div>
      </template>

      <!-- Empty State -->
      <div v-if="messages.length === 0" class="flex-1 flex items-center justify-center">
        <p class="text-[var(--text-muted)]">Сообщений пока нет</p>
      </div>
    </div>

    <!-- Input -->
    <ChatInput
      v-if="chat?.status !== 'closed'"
      :sending="sending"
      @send="handleSendMessage"
    />

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
