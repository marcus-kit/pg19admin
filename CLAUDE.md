# pg19v3admin

Административная панель ПЖ19 — управление контентом, пользователями, чатами поддержки, тикетами и AI-ботом.

## Структура

```
app/
  components/   # Vue компоненты (ui/, news/)
  pages/        # Роуты (file-based routing)
  composables/  # useX() функции
  types/        # TypeScript типы
server/
  api/          # API endpoints
  utils/        # Серверные утилиты
```

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
11. **Tailwind CSS v4** — используй `@import "tailwindcss"` вместо `@tailwind` директив. Warning `@import must precede` — некритичен

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

### Компоненты
- **Single-use** — инлайнь в страницу, не создавай отдельный файл
- **Multi-use** — выноси в `components/` (например, NewsEditor используется в create + edit)

## Ключевые зависимости

| Модуль | Библиотека |
|--------|------------|
| Chat | Supabase Realtime |
| Coverage Map | OpenLayers |
| News Editor | TipTap |
| AI Bot | OpenAI API |

## Code Style

### Именование файлов
| Тип | Формат | Пример |
|-----|--------|--------|
| Компоненты | PascalCase.vue (мин 2 слова) | UserCard.vue |
| Composables | useCamelCase.ts | useAuth.ts |
| Утилиты/Типы | camelCase.ts | formatDate.ts |

### Префиксы компонентов (folder = prefix)
| Папка | Префикс | Примеры |
|-------|---------|---------|
| ui/ | Ui | UiButton, UiCard, UiTable |
| news/ | News | NewsEditor |

### Порядок секций в script setup
```
1. import type { ... }        // Типы
2. definePageMeta()           // Макросы
3. defineProps / defineEmits  // API компонента
4. useX() composables         // useRoute, useToast
5. ref() / reactive()         // Состояние
6. computed()                 // Вычисляемые
7. function handlers()        // Функции
8. watch()                    // Наблюдатели
9. onMounted/onUnmounted      // Lifecycle
```

### Порядок атрибутов в template
`v-if → v-for → :key → ref → v-model → :props → @events → class`

### ESLint (автоматически)
- 2 пробела, одинарные кавычки, без `;`, trailing commas
- `pnpm lint:fix` исправляет автоматически

### Обязательно
- **Комментарии на русском** — всегда
- **Guard clauses** — ранний return вместо вложенных if
- **Деструктуризация** — `const { name } = user` вместо `user.name`
- **JSDoc** — для экспортируемых функций
- **Константы** — `USER_ROLE.ADMIN`, не `'admin'`
