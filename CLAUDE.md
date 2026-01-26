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
10. **Vue attributes order** — порядок: `:props` → `class` → статические → `@events` (ESLint vue/attributes-order)
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

**Принцип: минимализм, читаемость, никакого мусора.**

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
`v-if → v-for → :key → ref → v-model → :props → class → статические → @events`

### ESLint (автоматически)
- 2 пробела, одинарные кавычки, без `;`, trailing commas
- `pnpm lint:fix` исправляет автоматически

### Чего избегать
| ❌ Не используй | ✅ Используй | Почему |
|-----------------|--------------|--------|
| `var` | `const` / `let` | var имеет проблемы с областью видимости |
| `==` | `===` | == делает неявное преобразование типов |
| `any` | Конкретный тип | Теряется смысл TypeScript |
| `// @ts-ignore` | Исправить тип | Скрывает реальные проблемы |
| `v-if` + `v-for` вместе | computed для фильтрации | Антипаттерн Vue |
| Изменение props | `emit()` | Props только для чтения |
| Магические строки `'admin'` | Константы `USER_ROLE.ADMIN` | Легче искать и менять |
| `console.log` в проде | Удалять перед коммитом | Засоряет консоль |
| Arrow functions для handlers | `function name()` | Читаемость и hoisting |
| Inline styles | CSS классы | Gotcha #6, #7 |

### Best Practices

**Пиши коротко:**
```typescript
// ❌ Плохо
const isActive = computed(() => {
  if (user.value.status === 'active') return true
  else return false
})

// ✅ Хорошо
const isActive = computed(() => user.value.status === 'active')
```

**Guard clauses:**
```typescript
// ❌ Плохо — много вложенности
function process(user) {
  if (user) {
    if (user.isActive) {
      // логика
    }
  }
}

// ✅ Хорошо — ранний выход
function process(user) {
  if (!user) return
  if (!user.isActive) return
  // логика
}
```

**Удаляй мёртвый код** — Git помнит историю, не комментируй старый код

### Комментарии
- **На русском** — всегда
- **Объясняй неочевидное:**
```typescript
// Задержка 1с — API имеет лимит 60 req/min
await sleep(1000)

// ВАЖНО: Supabase возвращает null если не найдено, а не ошибку
const { data } = await supabase.from('users').single()
```
- **JSDoc** — для экспортируемых функций:
```typescript
/**
 * Форматирует дату в читаемый вид.
 * @param date — дата ISO или Date
 * @returns "15 янв. 2024"
 */
export function formatDate(date: string | Date): string
```

### Чеклист перед коммитом
- [ ] Нет закомментированного кода
- [ ] Нет `console.log`
- [ ] Нет `any` типов
- [ ] Понятные имена переменных
- [ ] Комментарии на русском
- [ ] ESLint без ошибок (`pnpm lint`)
