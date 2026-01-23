/**
 * Centralized status configuration for all admin entities
 * Eliminates duplicate getStatusBadgeClass/getStatusLabel functions across pages
 */

import type {
  NewsStatus,
  NewsCategory,
  UserStatus,
  OnlineStatus,
  AccountStatus,
  ContractStatus,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  ChatStatus,
  ConnectionRequestStatus,
  CallbackRequestStatus,
  RequestSource,
  StatusConfig,
  FilterOption
} from '~/types/admin'

// ==================== STATUS CONFIGURATIONS ====================

export const NEWS_STATUS: Record<NewsStatus, StatusConfig> = {
  draft: { label: 'Черновик', badgeClass: 'bg-gray-500/20 text-gray-400' },
  published: { label: 'Опубликовано', badgeClass: 'bg-green-500/20 text-green-400' },
  archived: { label: 'Архив', badgeClass: 'bg-orange-500/20 text-orange-400' }
}

export const NEWS_CATEGORY: Record<NewsCategory, StatusConfig> = {
  announcement: { label: 'Объявление', badgeClass: 'bg-blue-500/20 text-blue-400' },
  protocol: { label: 'Протокол', badgeClass: 'bg-purple-500/20 text-purple-400' },
  notification: { label: 'Уведомление', badgeClass: 'bg-secondary/20 text-secondary' }
}

export const USER_STATUS: Record<UserStatus, StatusConfig> = {
  active: { label: 'Активен', badgeClass: 'bg-green-500/20 text-green-400' },
  suspended: { label: 'Приостановлен', badgeClass: 'bg-yellow-500/20 text-yellow-400' },
  terminated: { label: 'Удалён', badgeClass: 'bg-red-500/20 text-red-400' }
}

export const ONLINE_STATUS: Record<OnlineStatus, StatusConfig> = {
  online: { label: 'Онлайн', badgeClass: 'bg-green-500' },
  away: { label: 'Отошёл', badgeClass: 'bg-yellow-500' },
  offline: { label: 'Оффлайн', badgeClass: 'bg-gray-500' }
}

export const ACCOUNT_STATUS: Record<AccountStatus, StatusConfig> = {
  active: { label: 'Активен', badgeClass: 'bg-green-500/20 text-green-400' },
  blocked: { label: 'Заблокирован', badgeClass: 'bg-red-500/20 text-red-400' },
  closed: { label: 'Закрыт', badgeClass: 'bg-gray-500/20 text-gray-400' }
}

export const CONTRACT_STATUS: Record<ContractStatus, StatusConfig> = {
  draft: { label: 'Черновик', badgeClass: 'bg-blue-500/20 text-blue-400' },
  active: { label: 'Активный', badgeClass: 'bg-green-500/20 text-green-400' },
  terminated: { label: 'Расторгнут', badgeClass: 'bg-red-500/20 text-red-400' },
  stopped: { label: 'Приостановлен', badgeClass: 'bg-yellow-500/20 text-yellow-400' }
}

export const TICKET_STATUS: Record<TicketStatus, StatusConfig> = {
  new: { label: 'Новый', badgeClass: 'bg-blue-500/20 text-blue-400' },
  open: { label: 'В работе', badgeClass: 'bg-green-500/20 text-green-400' },
  pending: { label: 'Ожидает', badgeClass: 'bg-yellow-500/20 text-yellow-400' },
  resolved: { label: 'Решён', badgeClass: 'bg-purple-500/20 text-purple-400' },
  closed: { label: 'Закрыт', badgeClass: 'bg-gray-500/20 text-gray-400' }
}

export const TICKET_PRIORITY: Record<TicketPriority, StatusConfig> = {
  urgent: { label: 'Срочный', badgeClass: 'bg-red-500/20 text-red-400' },
  high: { label: 'Высокий', badgeClass: 'bg-orange-500/20 text-orange-400' },
  normal: { label: 'Обычный', badgeClass: 'bg-gray-500/20 text-gray-300' },
  low: { label: 'Низкий', badgeClass: 'bg-gray-500/10 text-gray-500' }
}

export const TICKET_CATEGORY: Record<TicketCategory, StatusConfig> = {
  technical: { label: 'Техническая проблема', badgeClass: 'bg-blue-500/20 text-blue-400' },
  billing: { label: 'Оплата', badgeClass: 'bg-green-500/20 text-green-400' },
  connection: { label: 'Подключение', badgeClass: 'bg-purple-500/20 text-purple-400' },
  other: { label: 'Другое', badgeClass: 'bg-gray-500/20 text-gray-400' }
}

export const CHAT_STATUS: Record<ChatStatus, StatusConfig> = {
  active: { label: 'Активный', badgeClass: 'bg-green-500/20 text-green-400' },
  waiting: { label: 'Ожидает', badgeClass: 'bg-yellow-500/20 text-yellow-400' },
  processing: { label: 'В обработке', badgeClass: 'bg-blue-500/20 text-blue-400' },
  closed: { label: 'Закрыт', badgeClass: 'bg-gray-500/20 text-gray-400' },
  resolved: { label: 'Решён', badgeClass: 'bg-purple-500/20 text-purple-400' }
}

export const CONNECTION_REQUEST_STATUS: Record<ConnectionRequestStatus, StatusConfig> = {
  new: { label: 'Новая', badgeClass: 'bg-blue-500/20 text-blue-400' },
  contacted: { label: 'Связались', badgeClass: 'bg-yellow-500/20 text-yellow-400' },
  approved: { label: 'Одобрена', badgeClass: 'bg-green-500/20 text-green-400' },
  rejected: { label: 'Отклонена', badgeClass: 'bg-red-500/20 text-red-400' },
  completed: { label: 'Выполнена', badgeClass: 'bg-gray-500/20 text-gray-400' }
}

export const CALLBACK_REQUEST_STATUS: Record<CallbackRequestStatus, StatusConfig> = {
  new: { label: 'Новая', badgeClass: 'bg-blue-500/20 text-blue-400' },
  processing: { label: 'В работе', badgeClass: 'bg-yellow-500/20 text-yellow-400' },
  completed: { label: 'Выполнена', badgeClass: 'bg-green-500/20 text-green-400' },
  rejected: { label: 'Отклонена', badgeClass: 'bg-red-500/20 text-red-400' }
}

export const REQUEST_SOURCE: Record<RequestSource, StatusConfig> = {
  website: { label: 'Сайт', badgeClass: 'bg-blue-500/20 text-blue-400' },
  mobile_app: { label: 'Приложение', badgeClass: 'bg-purple-500/20 text-purple-400' },
  call_center: { label: 'Колл-центр', badgeClass: 'bg-green-500/20 text-green-400' }
}

// Generic boolean active/inactive status for services, categories, etc.
export const ACTIVE_STATUS: Record<'active' | 'inactive', StatusConfig> = {
  active: { label: 'Активна', badgeClass: 'bg-green-500/20 text-green-400' },
  inactive: { label: 'Неактивна', badgeClass: 'bg-gray-500/20 text-gray-400' }
}

// ==================== FILTER OPTIONS ====================

export const NEWS_STATUS_OPTIONS: FilterOption<NewsStatus>[] = [
  { value: 'all', label: 'Все' },
  { value: 'published', label: 'Опубликованные' },
  { value: 'draft', label: 'Черновики' },
  { value: 'archived', label: 'Архив' }
]

export const USER_STATUS_OPTIONS: FilterOption<UserStatus>[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'suspended', label: 'Приостановлены' },
  { value: 'terminated', label: 'Удалены' }
]

export const ACCOUNT_STATUS_OPTIONS: FilterOption<AccountStatus>[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'blocked', label: 'Заблокированы' },
  { value: 'closed', label: 'Закрыты' }
]

export const CONTRACT_STATUS_OPTIONS: FilterOption<ContractStatus>[] = [
  { value: 'all', label: 'Все договоры' },
  { value: 'draft', label: 'Черновик' },
  { value: 'active', label: 'Активный' },
  { value: 'terminated', label: 'Расторгнут' },
  { value: 'stopped', label: 'Приостановлен' }
]

export const TICKET_STATUS_OPTIONS: FilterOption[] = [
  { value: 'active', label: 'Активные' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'closed', label: 'Закрытые' }
]

export const TICKET_PRIORITY_OPTIONS: FilterOption<TicketPriority>[] = [
  { value: 'all', label: 'Все приоритеты' },
  { value: 'urgent', label: 'Срочный' },
  { value: 'high', label: 'Высокий' },
  { value: 'normal', label: 'Обычный' },
  { value: 'low', label: 'Низкий' }
]

export const CHAT_STATUS_OPTIONS: FilterOption<ChatStatus>[] = [
  { value: 'waiting', label: 'Ожидают' },
  { value: 'active', label: 'Активные' },
  { value: 'closed', label: 'Закрытые' },
  { value: 'all', label: 'Все' }
]

export const CONNECTION_STATUS_OPTIONS: FilterOption<ConnectionRequestStatus>[] = [
  { value: 'new', label: 'Новые' },
  { value: 'contacted', label: 'Связались' },
  { value: 'approved', label: 'Одобрены' },
  { value: 'rejected', label: 'Отклонены' },
  { value: 'completed', label: 'Выполнены' },
  { value: 'all', label: 'Все' }
]

export const CALLBACK_STATUS_OPTIONS: FilterOption<CallbackRequestStatus>[] = [
  { value: 'new', label: 'Новые' },
  { value: 'processing', label: 'В работе' },
  { value: 'completed', label: 'Выполнены' },
  { value: 'rejected', label: 'Отклонены' },
  { value: 'all', label: 'Все' }
]

// ==================== HELPER FUNCTIONS ====================

/**
 * Get status label from config map
 */
export function getStatusLabel<T extends string>(
  config: Record<T, StatusConfig>,
  status: T | string
): string {
  return config[status as T]?.label ?? status
}

/**
 * Get badge class from config map
 */
export function getStatusBadgeClass<T extends string>(
  config: Record<T, StatusConfig>,
  status: T | string
): string {
  return config[status as T]?.badgeClass ?? 'bg-gray-500/20 text-gray-400'
}

/**
 * Get both label and badge class
 */
export function getStatusConfig<T extends string>(
  config: Record<T, StatusConfig>,
  status: T | string
): StatusConfig {
  return config[status as T] ?? { label: status, badgeClass: 'bg-gray-500/20 text-gray-400' }
}

// ==================== COMPOSABLE ====================

/**
 * Composable for accessing status configurations
 * Provides reactive access to all status configs and helper methods
 */
export function useStatusConfig() {
  return {
    // Configs
    NEWS_STATUS,
    NEWS_CATEGORY,
    USER_STATUS,
    ONLINE_STATUS,
    ACCOUNT_STATUS,
    CONTRACT_STATUS,
    TICKET_STATUS,
    TICKET_PRIORITY,
    TICKET_CATEGORY,
    CHAT_STATUS,
    CONNECTION_REQUEST_STATUS,
    CALLBACK_REQUEST_STATUS,
    REQUEST_SOURCE,
    ACTIVE_STATUS,

    // Filter options
    NEWS_STATUS_OPTIONS,
    USER_STATUS_OPTIONS,
    ACCOUNT_STATUS_OPTIONS,
    CONTRACT_STATUS_OPTIONS,
    TICKET_STATUS_OPTIONS,
    TICKET_PRIORITY_OPTIONS,
    CHAT_STATUS_OPTIONS,
    CONNECTION_STATUS_OPTIONS,
    CALLBACK_STATUS_OPTIONS,

    // Helpers
    getStatusLabel,
    getStatusBadgeClass,
    getStatusConfig
  }
}
