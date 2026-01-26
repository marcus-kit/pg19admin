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

1. **Правила оформления кода CODE-STYLE в файле CODE-STYLE-GUIDE.md**
2. **useSupabaseUser()** — возвращает JWT claims, используй `user.sub` для ID (не `user.id`)
3. **Teleport hydration** — оборачивай `<Teleport>` в `<ClientOnly>`
4. **Login redirect** — после signIn используй `window.location.href`, не `router.push()` (нужен полный reload для сессии)
5. **Server imports** — явно импортируй `serverSupabaseServiceRole` из `#supabase/server`
6. **CSS Variables** — никогда не хардкодь цвета, используй `var(--color-*)`
7. **Glass card hover** — работает только с CSS классом, не inline styles
8. **pathPrefix: false** — компоненты регистрируются по filename, следи за конфликтами
9. **Supabase Auth** — используй встроенный auth, НЕ кастомный auth_sessions
10. **Vue attributes order** — порядок: `:props` → `@events` → `class` → статические (ESLint vue/attributes-order)
11. **Tailwind CSS v4** — используй `@import "tailwindcss"` вместо `@tailwind` директив. Warning `@import must precede` — некритичен
12. **Computed setter + объекты** — мутация свойств объекта НЕ триггерит setter. Используй watch с `deep: true` или создавай новый объект
13. **Двусторонняя синхронизация** — при watch↔watch добавь флаг `isSyncing` чтобы избежать бесконечного цикла
14. **ESLint стиль** — `} else {` запрещён, только `}\nelse {`. Один statement на строку в стрелочных функциях

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