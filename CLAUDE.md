# pg19v3admin

Административная панель ПЖ19 — управление контентом, пользователями, чатами поддержки, тикетами и AI-ботом.

## Стек

| Технология | Версия |
|------------|--------|
| Nuxt | 4.3 |
| Vue | 3.5 |
| Tailwind CSS | + CSS Variables |
| Supabase | PostgreSQL + Auth (JWT) |
| pnpm | Package Manager |

**UI**: Russian | **Comments**: Russian OK

## Deploy

**Только `git push`!** Локальные билды запрещены (RAM constraint на сервере).

```bash
git add -A && git commit -m "message" && git push
```

## Gotchas (критично!)

1. **No local builds** — только `git push`, билд на Dokploy
2. **useSupabaseUser()** — возвращает JWT claims, используй `user.sub` для ID (не `user.id`)
3. **Teleport hydration** — оборачивай `<Teleport>` в `<ClientOnly>`
4. **Login redirect** — после signIn используй `window.location.href`, не `router.push()` (нужен полный reload для сессии)
5. **Server imports** — явно импортируй `serverSupabaseServiceRole` из `#supabase/server`
6. **CSS Variables** — никогда не хардкодь цвета, используй `var(--color-*)`
7. **Glass card hover** — работает только с CSS классом, не inline styles
8. **pathPrefix: false** — компоненты регистрируются по filename, следи за конфликтами
9. **Supabase Auth** — используй встроенный auth, НЕ кастомный auth_sessions
10. **Vue attributes order** — динамические `:attr` перед статическими `attr` (ESLint vue/attributes-order)

## Конвенции

### Именование компонентов: folder = prefix

```
components/ui/UiButton.vue      → <UiButton />
components/chat/ChatInput.vue   → <ChatInput />
components/tickets/TicketSidebar.vue → <TicketSidebar />
```

## Environment Variables

**Server-only** (Dokploy → Environment):
```
SUPABASE_SERVICE_KEY=eyJ...
OPENAI_API_KEY=sk-...
```

**Public** (Dokploy → Build Arguments):
```
SUPABASE_URL=https://supabase.doka.team
SUPABASE_KEY=eyJ...
```

## Паттерны

### List-страницы
- Используй `useAdminList` composable для всех списков с фильтрацией
- `transformParams` — для виртуальных фильтров (UI ≠ API параметры)
- Компоненты: `UiLoading`, `UiFilterTabs`, `UiEmptyState`

### Shared UI компоненты
- `UiStatCard` — карточка статистики с цветами (primary, green, red, etc.)
- `UiLoading` — спиннер загрузки (size: sm/md/lg)
- `UiFilterTabs` — табы фильтрации с v-model
- `useFormatters()` — явно импортируй форматтеры, не полагайся на auto-import

## Ключевые зависимости

| Модуль | Библиотека |
|--------|------------|
| Dashboard | chart.js |
| Chat | Supabase Realtime |
| Coverage Map | OpenLayers |
| News Editor | TipTap |
| AI Bot | OpenAI API |

## Code Style
Следуй правилам из файла CODE-STYLE.md