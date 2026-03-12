# Despliegue del MVP

## Objetivo

Publicar la plataforma en un servidor cloud.

---

# Infraestructura recomendada

Backend

Render / Railway / AWS

Base de datos

PostgreSQL

Frontend

Vercel / Netlify

---

# Despliegue backend

1 subir repositorio

2 configurar variables entorno

PORT=3000

DB_HOST=...

DB_USER=...

DB_PASS=...

---

# Despliegue frontend

build

npm run build

---

# Configurar API

En frontend:

const API_URL="https://api.midominio.com"

---

# Dominio

ejemplo:

app.midominio.com

---

# Monitorización

Herramientas:

Sentry  
Datadog  
Logtail