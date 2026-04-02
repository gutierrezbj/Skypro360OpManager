# OpsManager — Multi-stage production Dockerfile
# Node 20 + Next.js standalone output

# ── Stage 1: Dependencies ──
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --legacy-peer-deps

# ── Stage 2: Build ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . .

# Next.js standalone output
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Production ──
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy DB migration/seed files (needed for drizzle-kit push)
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/src/lib/db/schema ./src/lib/db/schema
COPY --from=builder /app/docker/postgres ./docker/postgres

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
