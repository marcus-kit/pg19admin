# Nuxt 4 Production Dockerfile
# Multi-stage build with pnpm for minimal image size

# Build stage
FROM node:24-alpine AS builder

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Build-time config (public variables baked into client bundle)
ARG SUPABASE_URL
ARG SUPABASE_KEY

ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_KEY=${SUPABASE_KEY}

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:24-alpine AS runner

WORKDIR /app

# Copy only the built output
COPY --from=builder /app/.output ./.output

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
