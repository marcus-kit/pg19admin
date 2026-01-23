# CLAUDE.md - pg19v3admin

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**pg19v3admin** — независимая административная панель ПЖ19 для управления контентом, пользователями, чатами поддержки, тикетами и AI-ботом.

| Параметр | Значение |
|----------|----------|
| **Фреймворк** | Nuxt 4.3 + Vue 3.5 |
| **Стилизация** | Tailwind CSS + CSS Variables |
| **База данных** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (JWT) |
| **Package Manager** | pnpm |

**Language**: Russian UI, Russian comments acceptable.

---

## Quick Start

```bash
pnpm install
pnpm dev
```

## Project Structure

```
pg19v3admin/
├── app/
│   ├── components/
│   │   ├── ui/              # UiButton, UiCard, UiInput, UiModal...
│   │   ├── chat/            # ChatDetailHeader, ChatInput, ChatMessageBubble
│   │   ├── tickets/         # TicketSidebar, TicketComments, TicketDetailHeader
│   │   ├── news/            # NewsEditor, NewsAttachments
│   │   ├── coverage/        # CoverageMap, CoverageImportExport
│   │   └── requests/        # ConnectionRequestsTab, CallbackRequestsTab
│   ├── composables/
│   │   ├── useFormatters.ts   # formatDate, formatKopeks, formatBalance, truncateText
│   │   ├── useAdminList.ts    # Generic list with pagination, filters
│   │   └── useStatusConfig.ts # Status labels and badge classes
│   ├── pages/                 # 26 pages
│   ├── layouts/
│   │   └── default.vue        # Sidebar navigation layout
│   ├── middleware/
│   │   └── admin.ts           # Route protection
│   └── assets/css/
│       └── main.css           # CSS Variables + Glass morphism
├── server/
│   ├── api/admin/             # 70+ API endpoints
│   └── utils/
│       ├── supabase.ts        # Database client (useSupabaseAdmin)
│       └── mappers.ts         # snake_case → camelCase
├── types/
│   └── admin.ts               # TypeScript interfaces
├── public/fonts/              # Self-hosted Outfit font
└── nuxt.config.ts
```

---

## Code Conventions

### Components: folder = prefix

```
components/
├── ui/UiButton.vue          → <UiButton />
├── chat/ChatInput.vue       → <ChatInput />
└── tickets/TicketSidebar.vue → <TicketSidebar />
```

**Rule:** Component filename must start with folder name as prefix.

### Script Setup Section Order

```typescript
// =============================================================================
// STORES & COMPOSABLES
// =============================================================================

// =============================================================================
// DATA — async data loading
// =============================================================================

// =============================================================================
// STATE — ref, reactive
// =============================================================================

// =============================================================================
// COMPUTED
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

---

## Environment Variables

### Server-only (Dokploy → Environment)

```
SUPABASE_SERVICE_KEY=eyJ...
OPENAI_API_KEY=sk-...
```

### Public (Dokploy → Build Arguments)

```
SUPABASE_URL=https://supabase.doka.team
SUPABASE_KEY=eyJ...
```

---

## Key Modules

### Dashboard (chart.js)

Stats with charts: users, accounts, news, requests.

### Chat (Supabase Realtime)

Support chat with real-time messages, file uploads.

### Coverage Map (OpenLayers)

Interactive coverage map with GeoJSON import/export.

### News Editor (TipTap)

Rich text editor with image uploads, link support.

### AI Bot Settings (OpenAI)

AI bot configuration, knowledge base management.

---

## Gotchas

1. **Supabase Auth** — uses built-in auth, NOT custom auth_sessions
2. **pathPrefix: false** — components registered by filename, watch for conflicts
3. **CSS Variables** — never hardcode colors, use var(--color-*)
4. **Glass card hover** — only works with CSS class, not inline styles
5. **Sidebar navigation** — differs from client (sidebar vs bottom nav)
6. **UI components** — all in ui/ folder with Ui* prefix
7. **No local builds** — use `git push` only, builds run on Dokploy server (RAM constraint)
8. **Component names** — use filename only (`ConnectionRequestsTab`), NOT folder prefix (`RequestsConnectionRequestsTab`)
9. **useSupabaseUser()** — returns JWT claims, use `user.sub` for ID (not `user.id`)
10. **Teleport hydration** — wrap `<Teleport>` in `<ClientOnly>` to avoid mismatch
11. **Login redirect** — use `window.location.href` after signIn, not `router.push()` (session needs full reload)
12. **Server imports** — explicitly import `serverSupabaseServiceRole` from `#supabase/server`

---

## API Structure

```
/api/admin/
├── auth/           # login, logout, me
├── dashboard/      # stats
├── users/          # CRUD + status
├── accounts/       # CRUD + status
├── news/           # CRUD + attachments
├── catalog/        # services, categories
├── chat/           # messages, assign, close, upload
├── tickets/        # comments, status, priority, assign
├── coverage/       # zones, import, export, partners
├── requests/       # connection, callback
└── ai/             # settings, knowledge
```

---

## Deploy

Project deploys via Dokploy with Docker build. **Do NOT run local builds** — push to git, Dokploy builds on server.

```bash
git add -A && git commit -m "message" && git push
```

---

*Refactored from pg19v2admin: removed PG19v2 layer dependency, migrated to pnpm, removed Pinia/roles system.*
