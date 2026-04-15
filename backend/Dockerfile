# ── Stage 1: dependencias ────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: imagen final ────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Crea usuario no-root por seguridad
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# No copiar .env (las variables se inyectan en runtime)
RUN rm -f .env

USER appuser

EXPOSE 3000

# Health check para Railway / Render
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "src/server.js"]
