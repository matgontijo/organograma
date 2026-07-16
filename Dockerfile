# syntax=docker/dockerfile:1

###############################################
# 1) Dependencies
###############################################
FROM node:20-alpine AS deps
WORKDIR /app
# libc6-compat helps some native deps on alpine
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

###############################################
# 2) Build (Next standalone output)
###############################################
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

###############################################
# 3) Runtime
###############################################
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone server + static assets + public dir
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Healthcheck hits the app's /api/health endpoint (also used by Render)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
