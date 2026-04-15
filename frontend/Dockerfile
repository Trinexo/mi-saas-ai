# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# VITE_API_URL se pasa como build arg para que quede incrustado en el bundle
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# ── Stage 2: servidor estático ───────────────────────────────────────────────
FROM nginx:alpine AS runner

# Copia el build de Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de nginx para SPA (React Router) + headers de caché
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
