import { serverSupabaseServiceRole } from '#supabase/server'

interface DashboardStats {
  news: {
    total: number
    published: number
    draft: number
    archived: number
  }
  users: {
    total: number
    active: number
    newToday: number
    activeContracts: number
  }
  catalog: {
    services: number
    activeServices: number
    categories: number
    activeCategories: number
  }
  requests: {
    total: number
    new: number
    inProgress: number
    completed: number
  }
  chats: {
    total: number
    waiting: number
    active: number
    closed: number
  }
  tickets: {
    total: number
    open: number
    pending: number
    resolved: number
  }
}

export default defineEventHandler(async (event): Promise<DashboardStats> => {
  // Проверяем авторизацию админа

  const supabase = serverSupabaseServiceRole(event)

  // Получаем начало сегодняшнего дня
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  // Параллельные запросы для всей статистики
  const [
    // Новости
    newsTotal,
    newsPublished,
    newsDraft,
    newsArchived,
    // Пользователи
    usersTotal,
    usersActive,
    usersNewToday,
    contractsActive,
    // Каталог
    servicesTotal,
    servicesActive,
    categoriesTotal,
    categoriesActive,
    // Заявки на подключение
    requestsTotal,
    requestsNew,
    requestsInProgress,
    requestsCompleted,
    // Чаты
    chatsTotal,
    chatsWaiting,
    chatsActive,
    chatsClosed,
    // Тикеты
    ticketsTotal,
    ticketsOpen,
    ticketsPending,
    ticketsResolved
  ] = await Promise.all([
    // Новости
    supabase.from('news').select('*', { count: 'exact', head: true }),
    supabase.from('news').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('news').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('news').select('*', { count: 'exact', head: true }).eq('status', 'archived'),
    // Пользователи
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('accounts').select('*', { count: 'exact', head: true }).eq('contract_status', 'active'),
    // Каталог
    supabase.from('services').select('*', { count: 'exact', head: true }),
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('service_categories').select('*', { count: 'exact', head: true }),
    supabase.from('service_categories').select('*', { count: 'exact', head: true }).eq('is_active', true),
    // Заявки на подключение
    supabase.from('connection_requests').select('*', { count: 'exact', head: true }),
    supabase.from('connection_requests').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('connection_requests').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('connection_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    // Чаты
    supabase.from('chats').select('*', { count: 'exact', head: true }),
    supabase.from('chats').select('*', { count: 'exact', head: true }).eq('status', 'waiting'),
    supabase.from('chats').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('chats').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
    // Тикеты
    supabase.from('tickets').select('*', { count: 'exact', head: true }),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'resolved')
  ])

  return {
    news: {
      total: newsTotal.count ?? 0,
      published: newsPublished.count ?? 0,
      draft: newsDraft.count ?? 0,
      archived: newsArchived.count ?? 0
    },
    users: {
      total: usersTotal.count ?? 0,
      active: usersActive.count ?? 0,
      newToday: usersNewToday.count ?? 0,
      activeContracts: contractsActive.count ?? 0
    },
    catalog: {
      services: servicesTotal.count ?? 0,
      activeServices: servicesActive.count ?? 0,
      categories: categoriesTotal.count ?? 0,
      activeCategories: categoriesActive.count ?? 0
    },
    requests: {
      total: requestsTotal.count ?? 0,
      new: requestsNew.count ?? 0,
      inProgress: requestsInProgress.count ?? 0,
      completed: requestsCompleted.count ?? 0
    },
    chats: {
      total: chatsTotal.count ?? 0,
      waiting: chatsWaiting.count ?? 0,
      active: chatsActive.count ?? 0,
      closed: chatsClosed.count ?? 0
    },
    tickets: {
      total: ticketsTotal.count ?? 0,
      open: ticketsOpen.count ?? 0,
      pending: ticketsPending.count ?? 0,
      resolved: ticketsResolved.count ?? 0
    }
  }
})
