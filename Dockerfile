# ═══════════════════════════════════════════════════════════════════════════
# Nuxt 4 Production Dockerfile
# Multi-stage build для минимального размера образа
# ═══════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Builder
# Устанавливаем зависимости и собираем приложение
# ─────────────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

# Включаем pnpm через corepack (встроен в Node 18+)
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Build-time переменные (публичные, вшиваются в клиентский бандл)
# Передаются через Dokploy → Build Arguments
ARG SUPABASE_URL
ARG SUPABASE_KEY

ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_KEY=${SUPABASE_KEY}

# Копируем файлы зависимостей отдельно для кеширования слоёв
COPY package.json pnpm-lock.yaml ./

# Устанавливаем зависимости (--frozen-lockfile для воспроизводимости)
RUN pnpm install --frozen-lockfile

# Копируем исходный код
COPY . .

# Собираем Nuxt приложение
RUN pnpm build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Runner
# Минимальный образ только с результатом сборки
# ─────────────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner

WORKDIR /app

# Копируем только собранное приложение (без node_modules, исходников)
COPY --from=builder /app/.output ./.output

# Runtime переменные
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

# Server-side секреты передаются через Dokploy → Environment:
# - SUPABASE_SERVICE_KEY
# - OPENAI_API_KEY

EXPOSE 3000

# Запускаем Nitro сервер
CMD ["node", ".output/server/index.mjs"]
