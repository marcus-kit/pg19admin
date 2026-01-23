## Промпт для Claude Code
Перед началом обнови свои знания о Nuxt последней версии и Vue пиоследней версии через Context7 и запиши их в NuxtVue.md

# Задача: Рефакторинг pg19v2admin → pg19v3admin

## Контекст

Мы успешно трансформировали pg19v2client (зависимый от Nuxt Layers PG19v2) в независимый проект pg19v3client. Теперь нужно сделать то же самое для административной панели pg19v2admin.

**Эталонный проект:** `/Users/doka/pg19v3client`
**Целевой проект:** `/Users/doka/pg19v2admin` → создать `/Users/doka/pg19v3admin`

## Цели рефакторинга

1. **Независимость** — убрать `extends: ['../PG19v2']` из nuxt.config.ts
2. **Модульность** — разделить монолитные stores на доменные
3. **Консистентность** — применить все конвенции из pg19v3client
4. **Очистка** — удалить мёртвый код, неиспользуемые зависимости
5. **pnpm** — перейти с npm на pnpm

---

## Фаза 0: Разведка pg19v2admin

### 0.1 Исследовать текущую структуру
```bash
# Структура проекта
ls -la /Users/doka/pg19v2admin
tree /Users/doka/pg19v2admin/app -L 2
tree /Users/doka/pg19v2admin/server -L 2

# Зависимости от PG19v2
grep -r "PG19v2\|extends:" /Users/doka/pg19v2admin/nuxt.config.ts
cat /Users/doka/pg19v2admin/package.json
```

**Вопросы для ответа:**
- Какие страницы есть? (users, settings, stats, logs?)
- Какие компоненты специфичны для админки?
- Какой auth механизм используется? (только Supa)
- Какие API endpoints есть?
- Какие зависимости используются (charts, xlsx, etc.)?

### 0.2 Документировать функционал
- Составить список всех страниц и их назначение
- Определить какие компоненты унаследованы от PG19v2
- Найти админ-специфичные утилиты и composables

### 0.4 Типичные админские модули (проверить наличие)
- `users/` — управление пользователями (список, карточка, блокировка)
- `accounts/` — управление лицевыми счетами
- `invoices/` — счета и платежи
- `support/` — тикеты и чат поддержки
- `news/` — создание/редактирование новостей
- `community/` — модерация соседского чата
- `stats/` — статистика и дашборд
- `settings/` — настройки системы
- `logs/` — журнал действий

---

## Фаза 1: Подготовка проекта

### 1.1 Создать новый проект
```bash
cd /Users/doka/pg19v3admin
pnpm init
```

### 1.2 Скопировать структуру pg19v2admin
```bash
# Копировать всё кроме node_modules, .nuxt, .output
rsync -av --exclude='node_modules' --exclude='.nuxt' --exclude='.output' \
  /Users/doka/pg19v2admin/ /Users/doka/pg19v3admin/

# Удалить package-lock.json (переходим на pnpm)
rm -f /Users/doka/pg19v3admin/package-lock.json
```

**Дополнительно для админки (добавить если используются в pg19v2admin):**
- `chart.js` + `vue-chartjs` — для графиков статистики
- `xlsx` — для экспорта данных в Excel
- `@tanstack/vue-table` — для сложных таблиц с сортировкой/фильтрацией

### Чеклист после Фазы 1:
- [ ] `pnpm install` без ошибок
- [ ] Нет `package-lock.json`
- [ ] Нет зависимостей от PG19v2 в package.json

---

## Фаза 2: Конфигурация Nuxt

### 2.1 nuxt.config.ts (по образцу pg19v3client)
```typescript
export default defineNuxtConfig({
  compatibilityDate: '2026-01-22',
  devtools: { enabled: true },

  features: {
    devLogs: false,
    appManifest: false
  },

  // Авто-импорт компонентов: folder = prefix
  components: [
    { path: '~/components', pathPrefix: false }
  ],

  css: ['~/assets/css/main.css'],

  // В проекте не используется кастомная авторизация - только Supabase Auth!
  supabase: {
  },

  runtimeConfig: {
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY || '',
    public: {
      supabaseUrl: process.env.SUPABASE_URL || 'https://supabase.doka.team',
      supabaseKey: process.env.SUPABASE_KEY || ''
    }
  },

  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark'
  },

  app: {
    head: {
      title: 'ПЖ19 — Админ-панель',
      meta: [
        { name: 'description', content: 'Административная панель ПЖ19' }
      ]
    }
  }
})
```

**ВАЖНО:** Удалить `extends: ['../PG19v2']` если есть!

### 2.4 public/fonts/
Скопировать шрифты из pg19v3client/public/fonts/

### Чеклист после Фазы 2:
- [ ] `pnpm dev` запускается без ошибок
- [ ] Нет `extends: ['../PG19v2']` в nuxt.config.ts
- [ ] Tailwind работает (стили применяются)
- [ ] Dark mode работает

---

## Фаза 3: Структура директорий

```
app/
├── components/
│   ├── ui/                  # Базовые UI 
│   │   ├── UiButton.vue
│   │   ├── UiCard.vue
│   │   ├── UiInput.vue
│   │   ├── UiSelect.vue
│   │   ├── UiTextarea.vue
│   │   ├── UiToggle.vue
│   │   ├── UiBadge.vue
│   │   ├── UiModal.vue
│   │   ├── UiSkeleton.vue
│   │   ├── UiEmptyState.vue
│   │   └── UiErrorState.vue
│   ├── admin/               # Общие админские компоненты
│   │   ├── AdminSidebar.vue
│   │   ├── AdminHeader.vue
│   │   ├── AdminStats.vue
│   │   └── AdminBreadcrumb.vue
│   ├── users/               # Управление пользователями
│   │   ├── UsersTable.vue
│   │   ├── UsersFilters.vue
│   │   └── UsersCard.vue
│   ├── accounts/            # Лицевые счета
│   │   ├── AccountsTable.vue
│   │   └── AccountsCard.vue
│   ├── support/             # Тикеты поддержки
│   │   ├── SupportTicketsList.vue
│   │   └── SupportTicketChat.vue
│   ├── news/                # Управление новостями
│   │   ├── NewsEditor.vue
│   │   └── NewsList.vue
│   ├── community/           # Модерация чата
│   │   └── CommunityModeration.vue
│   └── stats/               # Статистика
│       ├── StatsChart.vue
│       └── StatsCard.vue
├── composables/
│   ├── useFormatters.ts    
│   ├── useAdminApi.ts       # API для админки
├── stores/
│   ├── admin.ts             # Состояние админа ( user, role)
│   └── ...                  # Другие доменные stores
├── pages/
│   ├── index.vue            # Редирект на dashboard
│   ├── login.vue            # Страница входа
│   ├── dashboard/
│   │   └── index.vue        # Главная панель со статистикой
│   ├── users/
│   │   ├── index.vue        # Список пользователей
│   │   └── [id].vue         # Карточка пользователя
│   ├── accounts/
│   │   ├── index.vue        # Список лицевых счетов
│   │   └── [id].vue         # Карточка ЛС
│   ├── support/
│   │   ├── index.vue        # Список тикетов
│   │   └── [id].vue         # Чат с пользователем
│   ├── news/
│   │   ├── index.vue        # Список новостей
│   │   ├── create.vue       # Создание новости
│   │   └── [id].vue         # Редактирование новости
│   ├── community/
│   │   └── index.vue        # Модерация соседского чата
│   └── settings/
│       └── index.vue        # Настройки системы
├── middleware/
│   └── auth.ts              # Защита роутов + проверка роли admin
├── layouts/
│   └── default.vue          # Админский layout (sidebar + header)
├── types/
│   └── ...                  # TypeScript интерфейсы
└── assets/css/
    └── main.css

server/
├── api/
│   ├── admin/               # Админские endpoints
│   │   ├── stats.get.ts
│   │   └── settings.ts
│   ├── users/               # CRUD пользователей
│   ├── accounts/            # CRUD лицевых счетов
│   ├── support/             # Тикеты
│   ├── news/                # CRUD новостей
│   └── community/           # Модерация
├── utils/
│   ├── supabase.ts
│   ├── userAuth.ts          # + проверка роли admin
│   └── rateLimit.ts
└── plugins/
    └── validate-config.ts

public/
└── fonts/                   # Self-hosted Outfit font
```

---

## Фаза 4: Конвенции кода

### 4.1 Именование компонентов
**Правило:** Имя папки = префикс компонента
```
components/{folder}/{Folder}{Name}.vue → <FolderName />

ui/UiButton.vue           → <UiButton />
admin/AdminSidebar.vue    → <AdminSidebar />
users/UsersTable.vue      → <UsersTable />
stats/StatsChart.vue      → <StatsChart />
```

### 4.2 Порядок секций в Script Setup

**Для страниц:**
```javascript
// =============================================================================
// STORES & COMPOSABLES
// =============================================================================

// =============================================================================
// DATA — асинхронная загрузка
// =============================================================================

// =============================================================================
// STATE — ref, reactive
// =============================================================================

// =============================================================================
// COMPUTED
// =============================================================================

// =============================================================================
// CONSTANTS
// =============================================================================

// =============================================================================
// METHODS
// =============================================================================

// =============================================================================
// LIFECYCLE
// =============================================================================

// =============================================================================
// WATCHERS
// =============================================================================
```

**Для компонентов (дополнительно):**
- `PROPS & EMIT` — первая секция
- `EXPOSE` — последняя секция
- JSDoc в начале файла обязателен

### 4.3 Архитектура stores
```
Types (app/types/)           → Интерфейсы данных
API Composables (useXxxApi)  → Вызовы API, возвращают данные
Stores (app/stores/)         → Только state и простые мутации
useAuthInit                  → Оркестрация init/logout
```

### 4.5 Авторизация админов

**Вопросы для выяснения в Фазе 0:**
- Есть ли проверка роли (isAdmin, role === 'admin')?
- Какие уровни доступа? (superadmin, moderator, support?)


## Фаза 5: Рефакторинг кода

### 5.1 Компоненты
1. Переименовать все U* → Ui* (UButton → UiButton)
2. Скопировать базовые UI из pg19v2
3. Применить naming convention: folder = prefix
4. Добавить JSDoc к каждому компоненту
5. Разделить секции комментариями `// ===...===`

### 5.2 Stores
1. Найти монолитный auth.ts
2. Разделить на доменные stores (admin.ts, etc.)
3. Извлечь API-вызовы в composables (useAdminApi.ts)
4. Создать useAuthInit для оркестрации

### 5.3 Страницы
1. Добавить JSDoc с описанием
2. Разделить секции комментариями
3. Добавить русские описания секций
4. Использовать useFormatters вместо локальных функций

### 5.4 Server API
1. Организовать по доменам: users/, accounts/, support/, news/, etc.
2. Использовать `requireAdmin()` вместо `requireUser()` для защищённых endpoints
3. Добавить rate limiting где нужно

### Чеклист после Фазы 5:
- [ ] Все страницы открываются без 500 ошибок
- [ ] Авторизация работает
- [ ] CRUD операции работают (создание/редактирование/удаление)
- [ ] **Сравнить с pg19v2admin — тот же функционал**

---

## Фаза 6: Очистка

### 6.1 Удалить
- [ ] `extends: ['../PG19v2']` из nuxt.config.ts
- [ ] Все импорты из PG19v2
- [ ] Неиспользуемые компоненты
- [ ] Неиспользуемые composables
- [ ] Неиспользуемые stores
- [ ] Неиспользуемые API endpoints
- [ ] Мёртвый код (console.log, закомментированный код)
- [ ] Пустые папки
- [ ] package-lock.json (уже на pnpm)

### 6.2 Проверить
- [ ] Нет дублирования утилит (всё в useFormatters)
- [ ] Нет конфликтов имён компонентов
- [ ] Нет конфликтов composables
- [ ] Все импорты типов используются
- [ ] Нет неиспользуемых зависимостей в package.json

---

## Фаза 7: Финализация

### 7.1 CLAUDE.md
Создать по образцу pg19v3client с адаптацией для админки:
- Изменить описание проекта
- Обновить Dokploy Application ID
- Обновить домен
- Добавить админ-специфичные Gotchas

### 7.2 Dockerfile
```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG SUPABASE_URL
ARG SUPABASE_KEY
RUN pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

### 7.3 Environment Variables

**Server-only (в Dokploy → Environment):**
```
SUPABASE_SECRET_KEY=...         # Service role ключ Supabase
```

**Public (в Dokploy → Build Arguments):**
```
SUPABASE_URL=https://supabase.doka.team
SUPABASE_KEY=...                # Anon ключ Supabase
```

**Действие:** Извлечь актуальные переменные из текущего pg19v2admin в Dokploy.

### 7.4 Dokploy
1. Создать новое приложение в Dokploy
2. Настроить домен: pg19v3admin.doka.team
3. Добавить environment variables (см. выше)
4. Добавить build arguments
5. Включить auto-deploy

### 7.5 Тестирование
1. `pnpm dev` — проверить компиляцию
2. `pnpm build` — проверить production сборку
3. Проверить все страницы в браузере
4. Проверить авторизацию (вход/выход)
5. Проверить CRUD операции
6. Проверить API endpoints через DevTools

### Финальный чеклист:
- [ ] `pnpm dev` запускается без ошибок
- [ ] `pnpm build` успешен
- [ ] Деплой на pg19v3admin.doka.team работает
- [ ] Все env переменные настроены в Dokploy
- [ ] Авторизация работает
- [ ] Все страницы pg19v2admin воспроизведены в pg19v3admin
- [ ] CRUD операции работают

---

## Важные особенности (Gotchas)

### Общие (из pg19v3client):
1. **Supabase Auth используется** — кастомная авторизация через auth_sessions НЕ ИСПОЛЬЗУЕТСЯ
3. **pathPrefix: false** — компоненты по имени файла, следить за конфликтами
4. **index.vue нужен** — middleware работает только на существующих страницах
5. **Один layout** — default.vue, guest layout инлайнить в login.vue
6. **Self-hosted fonts** — public/fonts/, @font-face в main.css
7. **CSS переменные** — не хардкодить цвета, использовать var(--color-*)
8. **Glass card hover** — работает только с CSS классом, не inline styles

### Админ-специфичные:
9. **Проверка роли** — все API endpoints должны использовать `requireAdmin()`, не `requireUser()`
10. **Sidebar navigation** — админский layout отличается от клиентского (sidebar vs bottom nav)
11. **CRUD операции** — админка имеет больше write операций, проверять права
12. **Модерация** — endpoints модерации чата должны проверять права модератора
