/**
 * Centralized data mappers for snake_case → camelCase transformation
 * Eliminates duplicate mapping logic across API endpoints
 */

// ==================== NEWS ====================

export interface DbNews {
  id: string
  title: string
  summary: string | null
  content: string | null
  category: string
  status: string
  published_at: string | null
  expires_at: string | null
  is_pinned: boolean
  author_id: string | null
  date_created: string
  date_updated: string
}

export function mapNews(item: DbNews) {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    content: item.content,
    category: item.category,
    status: item.status,
    publishedAt: item.published_at,
    expiresAt: item.expires_at,
    isPinned: item.is_pinned,
    authorId: item.author_id,
    createdAt: item.date_created,
    updatedAt: item.date_updated,
  }
}

// ==================== USERS ====================

export interface DbUser {
  id: string
  first_name: string
  last_name: string
  middle_name: string | null
  full_name: string | null
  email: string | null
  phone: string | null
  avatar: string | null
  status: string
  telegram_id: string | null
  telegram_username: string | null
  vk_id: string | null
  online_status: string
  last_seen_at: string | null
  birth_date: string | null
  nickname: string | null
  created_at: string
  updated_at: string | null
}

export function mapUser(user: DbUser, accountsCount?: number) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    middleName: user.middle_name,
    fullName: user.full_name || `${user.last_name} ${user.first_name}`.trim(),
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    status: user.status,
    telegram: user.telegram_id
      ? {
          id: user.telegram_id,
          username: user.telegram_username,
        }
      : null,
    vkId: user.vk_id,
    onlineStatus: user.online_status,
    lastSeenAt: user.last_seen_at,
    birthDate: user.birth_date,
    nickname: user.nickname,
    accountsCount: accountsCount ?? 0,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }
}

export function mapUserShort(user: Pick<DbUser, 'id' | 'first_name' | 'last_name' | 'full_name'>) {
  return {
    id: user.id,
    fullName: user.full_name || `${user.last_name} ${user.first_name}`.trim(),
  }
}

// ==================== ACCOUNTS ====================

export interface DbAccount {
  id: string
  user_id: string | null
  contract_number: number | null
  contract_status: string
  status: string
  balance: number
  address_full: string | null
  start_date: string | null
  blocked_at: string | null
  date_created: string
  date_updated: string
}

export function mapAccount(
  acc: DbAccount,
  user?: { id: string, fullName: string } | null,
) {
  return {
    id: acc.id,
    contractNumber: acc.contract_number,
    contractStatus: acc.contract_status,
    status: acc.status,
    balance: acc.balance,
    addressFull: acc.address_full,
    user: user ?? null,
    startDate: acc.start_date,
    blockedAt: acc.blocked_at,
    createdAt: acc.date_created,
    updatedAt: acc.date_updated,
  }
}

// ==================== TICKETS ====================

export interface DbTicket {
  id: string
  number: string
  user_id: string
  user_name: string | null
  user_email: string | null
  user_phone: string | null
  subject: string
  description: string | null
  category: string
  status: string
  priority: string
  assigned_admin_id: string | null
  first_response_at: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export function mapTicket(
  ticket: DbTicket,
  assignedAdmin?: { id: string, fullName: string } | null,
) {
  return {
    id: ticket.id,
    number: ticket.number,
    userId: ticket.user_id,
    userName: ticket.user_name,
    userEmail: ticket.user_email,
    userPhone: ticket.user_phone,
    subject: ticket.subject,
    description: ticket.description,
    category: ticket.category,
    status: ticket.status,
    priority: ticket.priority,
    assignedAdmin: assignedAdmin ?? null,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    firstResponseAt: ticket.first_response_at,
    resolvedAt: ticket.resolved_at,
  }
}

// ==================== CHATS ====================

export interface DbChat {
  id: string
  user_id: string | null
  user_name: string | null
  user_telegram_id: number | null
  guest_name: string | null
  guest_contact: string | null
  status: string
  subject: string | null
  assigned_admin_id: string | null
  assigned_admin?: { id: string, full_name: string } | null
  last_message_at: string | null
  last_admin_message_at: string | null
  last_user_message_at: string | null
  unread_admin_count: number
  created_at: string
  closed_at: string | null
}

export function mapChat(chat: DbChat) {
  return {
    id: chat.id,
    userId: chat.user_id,
    userName: chat.user_name ?? chat.guest_name,
    guestName: chat.guest_name,
    guestContact: chat.guest_contact,
    userTelegramId: chat.user_telegram_id,
    status: chat.status,
    subject: chat.subject,
    assignedAdmin: chat.assigned_admin
      ? { id: chat.assigned_admin.id, fullName: chat.assigned_admin.full_name }
      : null,
    unreadAdminCount: chat.unread_admin_count ?? 0,
    lastMessageAt: chat.last_message_at,
    lastAdminMessageAt: chat.last_admin_message_at,
    lastUserMessageAt: chat.last_user_message_at,
    createdAt: chat.created_at,
    closedAt: chat.closed_at,
  }
}

export interface DbChatMessage {
  id: number
  chat_id: number
  sender_id: number | null
  sender_type: string
  sender_name: string | null
  content: string
  attachment_url: string | null
  attachment_name: string | null
  attachment_size: number | null
  is_read: boolean
  created_at: string
}

export function mapChatMessage(msg: DbChatMessage) {
  return {
    id: msg.id,
    chatId: msg.chat_id,
    senderId: msg.sender_id,
    senderType: msg.sender_type,
    senderName: msg.sender_name,
    content: msg.content,
    attachmentUrl: msg.attachment_url,
    attachmentName: msg.attachment_name,
    attachmentSize: msg.attachment_size,
    isRead: msg.is_read,
    createdAt: msg.created_at,
  }
}

// ==================== REQUESTS ====================

export interface DbConnectionRequest {
  id: string
  full_name: string
  phone: string
  address_text: string
  in_coverage_zone: boolean
  status: string
  source: string
  comment: string | null
  coordinates: { lat: number, lon: number } | null
  processed_by: string | null
  processed_at: string | null
  created_at: string
  updated_at: string
}

export function mapConnectionRequest(req: DbConnectionRequest) {
  return {
    id: req.id,
    fullName: req.full_name,
    phone: req.phone,
    addressText: req.address_text,
    inCoverageZone: req.in_coverage_zone,
    status: req.status,
    source: req.source,
    comment: req.comment,
    coordinates: req.coordinates,
    processedBy: req.processed_by,
    processedAt: req.processed_at,
    createdAt: req.created_at,
    updatedAt: req.updated_at,
  }
}

export interface DbCallbackRequest {
  id: string
  name: string
  phone: string
  status: string
  source: string | null
  processed_by_admin_id: string | null
  created_at: string
}

export function mapCallbackRequest(
  req: DbCallbackRequest,
  admin?: { id: string, fullName: string } | null,
) {
  return {
    id: req.id,
    name: req.name,
    phone: req.phone,
    status: req.status,
    source: req.source,
    processedByAdmin: admin ?? null,
    createdAt: req.created_at,
  }
}

// ==================== CATALOG ====================

export interface DbService {
  id: string
  name: string
  slug: string
  description: string | null
  category_id: string
  price: number
  features: Record<string, unknown>
  is_active: boolean
  sort_order: number
  date_created: string
  date_updated: string
}

export function mapService(
  service: DbService,
  categoryName?: string,
) {
  return {
    id: service.id,
    name: service.name,
    slug: service.slug,
    description: service.description,
    categoryId: service.category_id,
    categoryName: categoryName ?? '',
    price: service.price,
    features: service.features,
    isActive: service.is_active,
    sortOrder: service.sort_order,
    createdAt: service.date_created,
    updatedAt: service.date_updated,
  }
}

export interface DbServiceCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
}

export function mapServiceCategory(
  cat: DbServiceCategory,
  servicesCount?: number,
) {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    icon: cat.icon,
    sortOrder: cat.sort_order,
    isActive: cat.is_active,
    servicesCount: servicesCount ?? 0,
  }
}

// ==================== ADMINS ====================

export interface DbAdmin {
  id: string
  auth_user_id: string
  full_name: string
  email: string
  role: string
  telegram_id: number | null
  permissions: string[]
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

export function mapAdmin(admin: DbAdmin) {
  return {
    id: admin.id,
    authUserId: admin.auth_user_id,
    fullName: admin.full_name,
    email: admin.email,
    role: admin.role,
    telegramId: admin.telegram_id,
    permissions: admin.permissions,
    isActive: admin.is_active,
    lastLoginAt: admin.last_login_at,
    createdAt: admin.created_at,
  }
}

// ==================== NEWS ATTACHMENTS ====================

export interface DbNewsAttachment {
  id: string
  news_id: string
  file_name: string
  storage_path: string
  file_size: number
  mime_type: string
  created_at: string
}

export function mapNewsAttachment(att: DbNewsAttachment) {
  return {
    id: att.id,
    newsId: att.news_id,
    fileName: att.file_name,
    storagePath: att.storage_path,
    fileSize: att.file_size,
    mimeType: att.mime_type,
    createdAt: att.created_at,
  }
}

// ==================== PAGES ====================

export interface DbPage {
  id: string
  slug: string
  title: string
  content: string | null
  meta_title: string | null
  meta_description: string | null
  is_published: boolean
  sort_order: number
  author_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export function mapPage(page: DbPage) {
  return {
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
    updatedAt: page.updated_at,
  }
}

// ==================== NEWS ATTACHMENT (inline) ====================

export interface DbNewsAttachmentInline {
  id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  sort_order: number
}

export function mapNewsAttachmentInline(att: DbNewsAttachmentInline) {
  return {
    id: att.id,
    fileName: att.file_name,
    filePath: att.file_path,
    fileSize: att.file_size,
    mimeType: att.mime_type,
    sortOrder: att.sort_order,
  }
}

// ==================== SERVICE (inline with category) ====================

export interface DbServiceWithCategory {
  id: string
  name: string
  description: string | null
  full_description: string | null
  price_monthly: number | null
  price_connection: number | null
  image_url: string | null
  features: unknown[] | null
  sort_order: number
  is_active: boolean
  category_id: string
  category: { id: string, name: string, slug: string } | null
  created_at: string
  updated_at: string
}

export function mapServiceWithCategory(service: DbServiceWithCategory) {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    fullDescription: service.full_description,
    priceMonthly: service.price_monthly,
    priceConnection: service.price_connection,
    imageUrl: service.image_url,
    features: service.features || [],
    sortOrder: service.sort_order,
    isActive: service.is_active,
    categoryId: service.category_id,
    category: service.category,
    createdAt: service.created_at,
    updatedAt: service.updated_at,
  }
}

// ==================== SERVICE CATEGORY (with dates) ====================

export interface DbServiceCategoryFull {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export function mapServiceCategoryFull(cat: DbServiceCategoryFull) {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    icon: cat.icon,
    sortOrder: cat.sort_order,
    isActive: cat.is_active,
    createdAt: cat.created_at,
    updatedAt: cat.updated_at,
  }
}
