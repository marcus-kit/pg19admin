/**
 * Centralized type definitions for Admin Portal
 * All entity types and status configurations in one place
 */

// ==================== GENERIC STATUS SYSTEM ====================

export interface StatusConfig {
  label: string
  badgeClass: string
}

export type StatusMap<T extends string = string> = Record<T, StatusConfig>

// ==================== NEWS ====================

export type NewsCategory = 'announcement' | 'protocol' | 'notification'
export type NewsStatus = 'draft' | 'published' | 'archived'

export interface NewsItem {
  id: string
  title: string
  summary: string
  category: NewsCategory
  status: NewsStatus
  publishedAt: string | null
  isPinned: boolean
  createdAt: string
}

export interface NewsDetail extends NewsItem {
  content: string
  attachments: NewsAttachment[]
  author: { id: string, fullName: string } | null
  updatedAt: string
}

export interface NewsAttachment {
  id: string
  newsId: string
  fileName: string
  storagePath: string
  fileSize: number
  mimeType: string
  createdAt: string
}

export interface CreateNewsData {
  title: string
  summary?: string
  content: string
  category: NewsCategory
  status: NewsStatus
  isPinned?: boolean
}

export interface UpdateNewsData extends Partial<CreateNewsData> {}

// ==================== USERS ====================

export type UserStatus = 'active' | 'suspended' | 'terminated'
export type OnlineStatus = 'online' | 'away' | 'offline'

export interface User {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  fullName: string
  email: string | null
  phone: string | null
  avatar: string | null
  status: UserStatus
  telegram: { id: string, username: string | null } | null
  vkId: string | null
  onlineStatus: OnlineStatus
  lastSeenAt: string | null
  accountsCount: number
  createdAt: string
}

export interface UserDetail extends User {
  birthDate: string | null
  nickname: string | null
  accounts: AccountShort[]
  updatedAt: string
}

export interface AccountShort {
  id: string
  contractNumber: number | null
  status: AccountStatus
  balance: number
}

export interface UpdateUserData {
  firstName?: string
  lastName?: string
  middleName?: string | null
  email?: string | null
  phone?: string | null
  status?: UserStatus
  birthDate?: string | null
  nickname?: string | null
}

// ==================== ACCOUNTS ====================

export type AccountStatus = 'active' | 'blocked' | 'closed'
export type ContractStatus = 'draft' | 'active' | 'terminated' | 'stopped'

export interface Account {
  id: string
  contractNumber: number | null
  contractStatus: ContractStatus
  status: AccountStatus
  balance: number
  addressFull: string | null
  user: { id: string, fullName: string } | null
  startDate: string | null
  blockedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AccountDetail extends Account {
  tariff: { id: string, name: string, price: number } | null
  services: { id: string, name: string }[]
  billingHistory: BillingRecord[]
}

export interface BillingRecord {
  id: string
  amount: number
  type: 'payment' | 'charge' | 'correction'
  description: string
  createdAt: string
}

export interface UpdateAccountData {
  status?: AccountStatus
  contractStatus?: ContractStatus
  tariffId?: string | null
}

// ==================== TICKETS ====================

export type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TicketCategory = 'technical' | 'billing' | 'connection' | 'other'

export interface Ticket {
  id: string
  number: string
  userId: string
  userName: string | null
  userEmail: string | null
  subject: string
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  assignedAdmin: { id: string, fullName: string } | null
  createdAt: string
  updatedAt: string
  firstResponseAt: string | null
}

export interface TicketDetail extends Ticket {
  description: string
  comments: TicketComment[]
  history: TicketHistoryItem[]
}

export interface TicketComment {
  id: string
  ticketId: string
  authorId: string
  authorName: string
  authorType: 'user' | 'admin'
  content: string
  isInternal: boolean
  createdAt: string
}

export interface TicketHistoryItem {
  id: string
  ticketId: string
  adminId: string | null
  adminName: string | null
  action: string
  oldValue: string | null
  newValue: string | null
  createdAt: string
}

export interface UpdateTicketData {
  status?: TicketStatus
  priority?: TicketPriority
  assignedAdminId?: string | null
}

// ==================== CHATS ====================

export type ChatStatus = 'active' | 'waiting' | 'processing' | 'closed' | 'resolved'

export interface Chat {
  id: string
  userId: string | null
  userName: string | null
  guestName: string | null
  guestContact: string | null
  userTelegramId: number | null
  status: ChatStatus
  subject: string | null
  assignedAdmin: { id: string, fullName: string } | null
  unreadAdminCount: number
  lastMessageAt: string | null
  createdAt: string
}

export interface ChatMessage {
  id: string
  chatId: string
  senderId: string | null
  senderType: 'user' | 'admin' | 'system' | 'bot'
  senderName: string | null
  content: string
  attachmentUrl: string | null
  attachmentName: string | null
  attachmentSize: number | null
  isRead: boolean
  createdAt: string
}

// ==================== REQUESTS ====================

export type ConnectionRequestStatus = 'new' | 'contacted' | 'approved' | 'rejected' | 'completed'
export type CallbackRequestStatus = 'new' | 'processing' | 'completed' | 'rejected'
export type RequestSource = 'website' | 'mobile_app' | 'call_center'

export interface ConnectionRequest {
  id: string
  fullName: string
  phone: string
  addressText: string
  inCoverageZone: boolean
  status: ConnectionRequestStatus
  source: RequestSource
  createdAt: string
}

export interface ConnectionRequestDetail extends ConnectionRequest {
  comment: string | null
  coordinates: { lat: number, lon: number } | null
  processedBy: { id: string, fullName: string } | null
  processedAt: string | null
  updatedAt: string
}

export interface CallbackRequest {
  id: string
  name: string
  phone: string
  status: CallbackRequestStatus
  source: RequestSource | null
  createdAt: string
  processedByAdmin: { id: string, fullName: string } | null
}

// ==================== CATALOG ====================

export interface ServiceCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Service {
  id: string
  name: string
  description: string | null
  fullDescription: string | null
  priceMonthly: number
  priceConnection: number | null
  imageUrl: string | null
  features: unknown[]
  sortOrder: number
  isActive: boolean
  categoryId: string | null
  category: { id: string, name: string, slug: string } | null
  createdAt: string
  updatedAt: string
}

export interface CreateServiceData {
  name: string
  description?: string
  fullDescription?: string
  categoryId: string
  priceMonthly: number
  priceConnection?: number
  features?: unknown[]
  isActive?: boolean
  sortOrder?: number
}

export interface UpdateServiceData extends Partial<CreateServiceData> {}

// ==================== ADMINS ====================

export type AdminRole = 'admin' | 'moderator' | 'support' | 'viewer'

export interface Admin {
  id: string
  authUserId: string
  fullName: string
  email: string
  role: AdminRole
  telegramId: number | null
  permissions: string[]
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface AdminAuthState {
  isAuthenticated: boolean
  admin: Admin | null
  permissions: string[]
}

// ==================== FILTER OPTIONS ====================

export interface FilterOption<T extends string = string> {
  value: T | 'all'
  label: string
}

// ==================== API RESPONSES ====================

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface ApiError {
  statusCode: number
  message: string
  data?: unknown
}

// ==================== UTILITY TYPES ====================

/** Краткая информация о категории для выпадающих списков */
export interface CategoryOption {
  id: number
  name: string
}

/** Пользователь для поиска (accounts/create) */
export interface UserSearchResult {
  id: string
  fullName: string
  phone: string | null
  email: string | null
}
