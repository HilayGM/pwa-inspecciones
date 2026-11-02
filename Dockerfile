# syntax=docker/dockerfile:1

# 1. Base stage: Node.js 20 en Alpine (versión fija y ligera)
FROM node:20-alpine AS base
WORKDIR /app

# 2. Etapa deps: Instalación limpia de dependencias mediante npm ci
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# 3. Etapa build: Compilación de la aplicación Next.js
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# 4. Etapa runner: Ejecución con next start y usuario sin privilegios
FROM base AS runner
WORKDIR /app

ARG VERSION=0.1.0
LABEL org.opencontainers.image.title="pwa-inspecciones-laboratorio" \
      org.opencontainers.image.description="PWA de inspecciones y mantenimiento de laboratorios" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.authors="Martin Moreno Libreros"

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario y grupo de sistema sin privilegios
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar artefactos necesarios para el runtime de next start
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY --from=build /app/src/lib/security ./src/lib/security
COPY --from=build /app/.next ./.next
COPY --from=deps /app/node_modules ./node_modules

# Asignar propiedad de los archivos al usuario no privilegiado
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Verificación de salud periódica
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["npm", "start"]

