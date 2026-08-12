# --- Dependencias ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Build (también se usa como imagen "tools" para migraciones y seed) ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholder solo para el build (generate no se conecta a la BD);
# en runtime docker-compose inyecta el DATABASE_URL real.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
# next.config.ts autoriza el dominio de R2 en next/image durante el build
ARG R2_PUBLIC_URL=""
ENV R2_PUBLIC_URL=$R2_PUBLIC_URL
RUN npx prisma generate && npm run build

# --- Imagen final: solo el output standalone de Next ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs \
  && mkdir -p /data/uploads && chown -R nextjs:nodejs /data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV HOSTNAME=0.0.0.0 PORT=3000
CMD ["node", "server.js"]
